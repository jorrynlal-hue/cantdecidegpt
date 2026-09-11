import { requireSession, ok, fail, fromError, readBody } from '@/lib/core/api/helpers';
import { captureOrder } from '@/lib/core/paypal';
import { setWorkspacePlan } from '@/lib/plans';
import { persist, uid } from '@/lib/core/db';

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    if (ctx.user.role === 'viewer') return fail('FORBIDDEN', 'Viewers cannot capture payments.', 403);
    const body = await readBody(req);
    const orderId = String(body.orderId ?? '');
    const planId  = String(body.planId  ?? '');
    if (!orderId) return fail('BAD_REQUEST', 'orderId is required.');
    const result = await captureOrder(orderId);
    const ws = db.workspaces.find((w) => w.id === ctx.workspaceId);
    if (ws) {
      setWorkspacePlan(ws, planId);
      ws.settings = { ...(ws.settings ?? {}), paypalCapture: result.captureId, paypalStatus: result.status };
    }
    // record payment
    db.payments = db.payments ?? [];
    db.payments.push({
      id: uid(),
      workspaceId: ctx.workspaceId,
      planId,
      amount: Number(planId === 'essential' ? 1000 : planId === 'pro' ? 1600 : 0),
      currency: 'USD',
      provider: 'paypal',
      providerRef: result.captureId,
      status: result.status === 'COMPLETED' ? 'completed' : result.status,
      createdById: ctx.user.id,
      createdAt: new Date().toISOString(),
    });
    persist(db);
    return ok({ status: result.status, captureId: result.captureId, planId, payerId: result.payerId });
  } catch (e) {
    return fromError(e);
  }
}