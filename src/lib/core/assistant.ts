import { DB, Ctx, Conversation } from './types';
import { now } from './db';
import { listActions, getAction } from './actions';
import { createConversation, appendMessage, listConversations, getConversation } from './engine/misc';
import { runProviderLive } from './providers';
import { searchDocuments } from './engine/docs';
import { computeInsights } from './analytics';
import { globalSearch } from './search';
import { AppError } from './error';

export interface AssistantReply {
  conversation: Conversation;
  reply: string;
  toolUsed?: string;
}

/**
 * The assistant takes a user message in a conversation, appends it, decides what
 * tool (universal action) to call, or falls back to the configured chat provider.
 * Real LLM calls are used when a live provider is configured; otherwise the
 * clearly-labeled baseline simulator is used. Replies are persisted like real chats.
 */
export async function chat(ctx: Ctx, db: DB, text: string, conversationId?: string): Promise<AssistantReply> {
  let conv: Conversation;
  if (conversationId) {
    conv = getConversation(db, ctx.workspaceId, conversationId);
    if (conv.userId !== ctx.user.id) throw AppError.forbidden();
  } else {
    conv = createConversation(ctx, db, text.slice(0, 60));
  }
  conv = appendMessage(ctx, db, conv.id, { role: 'user', content: text });

  const { reply, toolUsed } = await decideAndReply(ctx, db, text);

  conv = appendMessage(ctx, db, conv.id, { role: 'assistant', content: reply, name: toolUsed });
  return { conversation: conv, reply, toolUsed };
}

async function decideAndReply(ctx: Ctx, db: DB, text: string): Promise<{ reply: string; toolUsed?: string }> {
  const t = text.trim();
  const low = t.toLowerCase();

  // explicit tool invocation: /run <actionId> <json params>
  const runMatch = t.match(/^\/run\s+([a-z_]+)\s*\{?([\s\S]*)\}?$/) ?? t.match(/^\/run\s+([a-z_]+)$/);
  if (runMatch) {
    const action = getAction(runMatch[1]);
    if (!action) {
      const ids = listActions(ctx, db).map((a) => a.id).join(', ');
      const reply = `Unknown action "${runMatch[1]}". Available: ${ids}.`;
      return { reply };
    }
    let params: Record<string, unknown> = {};
    if (runMatch[2]) {
      try {
        const cleaned = runMatch[2].replace(/^\{/, '').replace(/\}$/, '').trim();
        params = JSON.parse(`{${cleaned}}`);
      } catch {
        return { reply: `Could not parse JSON params: ${runMatch[2]}` };
      }
    }
    try {
      const result = await action.run(ctx, db, params);
      return { reply: result.ok ? `Done: ${result.summary}` : `Failed: ${result.summary}`, toolUsed: action.id };
    } catch (err) {
      return { reply: `Action error: ${String(err)}`, toolUsed: action.id };
    }
  }

  // create task intent
  if (/create (a )?task/i.test(low) || /add (a )?task/i.test(low)) {
    const titled = t.match(/titled\s+"?([^"?.]+)"?/i)?.[1];
    const title = (titled ?? t.replace(/^[^:]*?(?=:)/i, '').replace(/^(create|add)\s+a?\s*task\s*[:,-]?\s*/i, '').trim()) || 'Untitled task';
    const action = getAction('create_task')!;
    const result = await action.run(ctx, db, { title });
    return { reply: result.ok ? `Done: ${result.summary}` : `Failed: ${result.summary}`, toolUsed: 'create_task' };
  }

  // summarize a document
  if (/summar(iz|is)e/i.test(low) && /document/i.test(low)) {
    const nameMatch = t.match(/["']([^"']+)["']/) ?? t.match(/:?\s*([A-Za-z0-9 _.-]+\.(txt|md|pdf|docx))$/i);
    const q = nameMatch ? nameMatch[1] : t.replace(/summar(iz|is)e.*document/i, '').trim() || 'attached contract';
    const docs = searchDocuments(db, ctx.workspaceId, q);
    if (!docs.length) {
      return { reply: `No documents matched "${q}". Try a more specific document name.`, toolUsed: 'search_documents' };
    }
    const doc = db.documents.find((d) => d.id === docs[0].id);
    const text = doc?.text ? doc.text.slice(0, 4000) : 'the document has no extracted text yet';
    const fmt = (await runProviderLive(db, ctx.workspaceId, 'chat', `Summarize this text:\n\n${text}`, { temperature: 0.3 })).output;
    return { reply: fmt, toolUsed: 'analyze_document' };
  }

  // analytics intent
  if (/analytics|overview|dashboard|how (are|is) (we|the)|summary of (the )?workspace|what.sthe.status/i.test(low)) {
    const ins = computeInsights(db, ctx.workspaceId);
    const reply = [
      `Here is your real workspace overview:`,
      `- Tasks: ${ins.openTasks} open, ${ins.overdueTasks} overdue`,
      `- Pipeline: ${ins.pipelineTotal.toFixed(2)} open value`,
      `- Finance: income ${ins.incomeTotal.toFixed(2)}, expense ${ins.expenseTotal.toFixed(2)}, net ${ins.netTotal.toFixed(2)}`,
      `- Docs: ${ins.docsCount}, Knowledge: ${ins.knowledgeCount}, Content: ${ins.contentCount}, Automations on: ${ins.activeAutomations}`,
      `(computed from your records — no simulated numbers)`,
    ].join('\n');
    return { reply, toolUsed: 'get_analytics' };
  }

  // search intent
  if (/search|find/i.test(low)) {
    const q = t.replace(/^(search|find)\s*(for)?\s*/i, '').replace(/[?.!]+$/, '').trim();
    const hits = globalSearch(db, ctx.workspaceId, q).hits.slice(0, 5);
    if (!hits.length) return { reply: `Nothing found for "${q}".`, toolUsed: 'search' };
    const reply = hits.map((h) => `[${h.type}] ${h.title}${h.subtitle ? ' — ' + h.subtitle : ''}`).join('\n');
    return { reply: `Found:\n${reply}`, toolUsed: 'search' };
  }

  if (/help|what can you do/i.test(low)) {
    const ids = listActions(ctx, db)
      .filter((a) => a.category !== 'insight' && a.category !== 'communication')
      .map((a) => `${a.id} — ${a.description}`);
    return {
      reply: `I can use tools (Universal Actions) to get real work done in your workspace. Try:\n- "Create a task: <title>"\n- "Summarize document <name>"\n- "Analytics"\n- "Search <term>"\n- "/run create_task {\"title\": \"Ship starter\"}"\n\nAvailable tools:\n${ids.join('\n')}`,
      toolUsed: 'help',
    };
  }

  // default chat through the configured provider (live or honest baseline)
  const out = await runProviderLive(db, ctx.workspaceId, 'chat', t);
  const tail = `\\n\\n(I can act too — type "help" to see the tools I can run on your data.)`;
  return { reply: out.output + tail };
}