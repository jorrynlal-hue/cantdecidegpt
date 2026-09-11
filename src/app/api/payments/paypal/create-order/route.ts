import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { createOrder } from '@/lib/core/paypal';

export async function POST(req: Request) {
  try {
    const { ctx } = await requireSession();
    if (ctx.user.role === 'viewer') return fail('FORBIDDEN', 'Viewers cannot initiate payments.', 403);
    const body = await readBody(req);
    const planId = String(body.planId ?? '');
    const amount = String(body.amount ?? '');
    if (!planId || !amount) return fail('BAD_REQUEST', 'planId and amount are required.');
    const description = `Can't Decide GPT — ${planId} plan subscription`;
    const result = await createOrder(amount, description, planId);
    return ok({ orderId: result.id, approveLink: result.approveLink, planId });
  } catch (e) {
    return fromError(e);
  }
}