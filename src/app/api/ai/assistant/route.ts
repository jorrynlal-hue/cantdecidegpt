import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { chat } from '@/lib/core/assistant';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = await readBody(req);
    const message = String(body.message ?? '');
    if (!message.trim()) return fail('BAD_REQUEST', 'Message is required.');
    const conversationId = body.conversationId ? String(body.conversationId) : undefined;
    const result = await chat(ctx, db, message, conversationId);
    return ok({ conversation: result.conversation, reply: result.reply, toolUsed: result.toolUsed });
  } catch (e) {
    return fromError(e);
  }
}

export async function GET(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');
    if (conversationId) {
      const conv = db.conversations.find((c) => c.id === conversationId && c.workspaceId === ctx.workspaceId && c.userId === ctx.user.id);
      if (!conv) return fail('NOT_FOUND', 'Conversation not found.', 404);
      return ok(conv);
    }
    const { listConversations } = await import('@/lib/core/engine/misc');
    return ok(listConversations(db, ctx.workspaceId, ctx.user.id));
  } catch (e) {
    return fromError(e);
  }
}