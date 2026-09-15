import { DB, Ctx } from './types';
import { now } from './db';
import { listActions, getAction } from './actions';
import { routeText, extractJsonObject, configuredTextProviders } from './router';
import { baselineOutput } from './providers';
import { logActivity, roleAtLeast } from './engine/core';
import { computeInsights } from './analytics';

export interface AgentStepTrace {
  index: number;
  kind: 'reason' | 'action';
  action?: string;
  ok: boolean;
  summary: string;
  data?: Record<string, unknown>;
}

export interface AgentResult {
  reply: string;
  summary: string;
  steps: AgentStepTrace[];
  provider: string;
  grounded: boolean;
}

interface PlanStep {
  tool: string;
  params: Record<string, unknown>;
  note?: string;
}

const EXCLUDED_TOOLS = new Set(['run_workflow', 'run_assistant', 'notify_team', 'get_analytics']);

const PLANNER_SYSTEM =
  'You are the planning engine inside a connected work platform. Translate a person\'s request into a short, concrete plan using the real tools available. Return strict JSON only — no prose, no markdown fences, no commentary.';

const REASON_SYSTEM =
  'You are working inside a live connected work platform with real records. Ground your answer in the provided context. Be precise, concise, and honest. Use markdown when it helps.';

const COMPOSER_SYSTEM =
  'You are the final responder inside a connected work platform. Write a concise, honest reply based strictly on what was actually done in the execution transcript. If real tools produced results, report them plainly. If a step failed or was skipped, say so. Never invent results. Keep the person\'s language tone. You may use short markdown.';

export function gatherWorkspaceContext(db: DB, workspaceId: string): string {
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  const name = ws?.name ?? 'this workspace';
  const tasks = db.tasks.filter((t) => t.workspaceId === workspaceId);
  const open = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < now() && t.status !== 'completed' && t.status !== 'cancelled');
  const projects = db.projects.filter((p) => p.workspaceId === workspaceId && p.status !== 'archived');
  const customers = db.customers.filter((c) => c.workspaceId === workspaceId);
  const deals = db.deals.filter((d) => d.workspaceId === workspaceId && d.stage !== 'won' && d.stage !== 'lost');
  const docs = db.documents.filter((d) => d.workspaceId === workspaceId).slice(0, 5);
  const knowledge = db.knowledge.filter((k) => k.workspaceId === workspaceId).slice(0, 4);
  const content = db.content.filter((c) => c.workspaceId === workspaceId).slice(0, 4);
  const convs = db.conversations.filter((c) => c.workspaceId === workspaceId).slice(-2);
  const unread = db.notifications.filter((n) => n.workspaceId === workspaceId && !n.read).slice(0, 5);
  const ins = computeInsights(db, workspaceId);
  const recentConv = convs
    .map((c) => {
      const last = c.messages[c.messages.length - 1];
      return `${c.title}: ${last?.role === 'user' ? 'user said' : 'assistant said'} ${(last?.content ?? '').slice(0, 120)}`;
    })
    .join('\n');
  const openTasks = open
    .slice(0, 8)
    .map((t) => `${t.title} [${t.status}${t.priority ? `/${t.priority}` : ''}${t.dueDate ? ` due ${t.dueDate}` : ''}]`)
    .join('\n');
  return [
    `Workspace: ${name}`,
    `Tasks: ${open.length} open (${overdue.length} overdue) of ${tasks.length} total`,
    openTasks ? `Open tasks:\n${openTasks}` : 'Open tasks: none',
    `Projects: ${projects.length} active`,
    `Customers: ${customers.length}, open deals: ${deals.length} totalling ${deals.reduce((s, d) => s + d.value, 0).toFixed(2)}`,
    `Pipeline value: ${ins.pipelineTotal.toFixed(2)}, income ${ins.incomeTotal.toFixed(2)}, expenses ${ins.expenseTotal.toFixed(2)}`,
    `Documents: ${docs.map((d) => d.name).join(', ') || 'none'}`,
    `Knowledge: ${knowledge.map((k) => k.title).join(', ') || 'none'}`,
    `Saved content: ${content.map((c) => c.title).join(', ') || 'none'}`,
    `Recent conversations: ${recentConv || 'none'}`,
    `Unread notifications: ${unread.map((n) => n.title).join(' | ') || 'none'}`,
  ].join('\n');
}

function plannerPrompt(context: string, tools: string, goal: string): string {
  return `Real workspace context:\n${context}\n\nAvailable tools (JSON):\n${tools}\n\nPerson's request: ${goal}\n\nReturn ONLY this JSON shape:\n{"summary":"one sentence of what you will do","steps":[{"tool":"reason" or "<toolId>","params":{...},"note":"why this step"}]}\n\nRules:\n- "reason" is for analysis only you can do; use a real tool whenever one fits.\n- Only send emails, publish posts, or create invoices/payments when explicitly requested or clearly required.\n- Enter actual values into params using the request and the context; leave truly unknown values as "".\n- Respect role limits: if a tool seems higher-risk, prefer creating records over sending external messages.\n- At most 6 steps. First step should be "reason" only if you need to analyze first.`;
}

function planSteps(parsed: Record<string, unknown> | null): PlanStep[] {
  if (!parsed || !Array.isArray(parsed.steps)) return [];
  return (parsed.steps as unknown as PlanStep[]).slice(0, 6).map((s) => ({
    tool: String(s.tool ?? 'reason'),
    params: s.params && typeof s.params === 'object' ? s.params : {},
    note: s.note ? String(s.note) : undefined,
  }));
}

async function buildPlan(context: string, tools: string, goal: string): Promise<PlanStep[]> {
  const prompt = plannerPrompt(context, tools, goal);
  const p1 = await routeText('chat', PLANNER_SYSTEM, prompt, { maxTokens: 1500, temperature: 0.2 });
  let steps = planSteps(extractJsonObject(p1.text));
  if (!steps.length) {
    try {
      const p2 = await routeText('chat', PLANNER_SYSTEM, `Your previous response was not valid JSON with a "steps" array. Reply with strict JSON only: ${prompt}`, { maxTokens: 1500, temperature: 0.2 });
      steps = planSteps(extractJsonObject(p2.text));
    } catch {
      steps = [];
    }
  }
  return steps;
}

async function runReasonStep(context: string, goal: string, note: string | undefined, params: Record<string, unknown>): Promise<string> {
  const asked = note && note.trim() ? note : goal;
  const extra = JSON.stringify(params) === '{}' ? '' : `\nGiven parameters: ${JSON.stringify(params)}`;
  const out = await routeText('chat', REASON_SYSTEM, `Real workspace context:\n${context}\n\nOriginal request: ${goal}\n\nReasoning task: ${asked}${extra}`, { maxTokens: 700, temperature: 0.4 });
  return out.text;
}

function actionToolList(ctx: Ctx, db: DB): { id: string; label: string; description: string; params: { name: string; label: string; type: string; required?: boolean }[] }[] {
  return listActions(ctx, db)
    .filter((a) => !EXCLUDED_TOOLS.has(a.id))
    .map((a) => ({ id: a.id, label: a.label, description: a.description, params: a.params }));
}

export async function runAgent(ctx: Ctx, db: DB, goal: string): Promise<AgentResult> {
  const context = gatherWorkspaceContext(db, ctx.workspaceId);

  if (configuredTextProviders().length === 0) {
    const out = baselineOutput('chat', goal);
    logActivity(ctx, db, { action: 'agent_run', result: `baseline reply for: ${goal.slice(0, 80)}` });
    return {
      reply: `${out}\n\n(Connect an AI provider in Settings → AI to get the full agent: planning, real tool execution, and verified replies.)`,
      summary: 'Baseline reply (no live provider configured)',
      steps: [],
      provider: 'baseline',
      grounded: true,
    };
  }

  const toolsJson = JSON.stringify(actionToolList(ctx, db));
  let steps = await buildPlan(context, toolsJson, goal);
  if (steps.length === 0) steps = [{ tool: 'reason', params: {}, note: goal }];

  const traces: AgentStepTrace[] = [];
  let okCount = 0;
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const index = i + 1;
    if (step.tool === 'reason') {
      try {
        const text = await runReasonStep(context, goal, step.note, step.params);
        okCount += 1;
        traces.push({ index, kind: 'reason', ok: true, summary: (step.note || 'analysis') + '\n' + text.slice(0, 200) });
      } catch (err) {
        traces.push({ index, kind: 'reason', ok: false, summary: `Reasoning failed: ${err instanceof Error ? err.message : String(err)}` });
      }
      continue;
    }
    const action = getAction(step.tool);
    if (!action) {
      traces.push({ index, kind: 'action', action: step.tool, ok: false, summary: `Unknown tool "${step.tool}" — skipped.` });
      continue;
    }
    if (action.minRole && !roleAtLeast(ctx.user.role, action.minRole)) {
      traces.push({ index, kind: 'action', action: action.id, ok: false, summary: `Skipped: "${action.label}" needs a higher role.` });
      continue;
    }
    try {
      const result = await action.run(ctx, db, step.params ?? {});
      if (result.ok) okCount += 1;
      traces.push({
        index,
        kind: 'action',
        action: action.id,
        ok: result.ok,
        summary: result.ok ? `${action.label}: ${result.summary}` : `Step failed: ${result.summary}`,
        data: result.data,
      });
    } catch (err) {
      traces.push({ index, kind: 'action', action: action.id, ok: false, summary: `${action.label} errored: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  const transcript = traces.map((s) => `Step ${s.index}: ${s.summary}`).join('\n');
  let reply: string;
  let provider = 'baseline';
  try {
    const out = await routeText('chat', COMPOSER_SYSTEM, `Person's request: ${goal}\n\nReal execution transcript (do not repeat verbatim, but report on it):\n${transcript}`, { maxTokens: 1100, temperature: 0.5 });
    provider = out.provider;
    reply = out.text;
  } catch {
    reply = `Here is what I actually did (${okCount}/${traces.length} steps completed):\n\n${transcript}`;
  }

  logActivity(ctx, db, { action: 'agent_run', result: `${okCount}/${traces.length} steps for: ${goal.slice(0, 80)} (via ${provider})` });
  return {
    reply,
    summary: `${okCount}/${traces.length} steps completed (${provider})`,
    steps: traces,
    provider,
    grounded: true,
  };
}