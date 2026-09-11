import { NextRequest } from 'next/server';
import { getWorkItem, updateWorkItem, actStage, publicShape } from '@/lib/uiol/engine';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = getWorkItem(id);
  if (!item) return Response.json({ ok: false, error: 'Work item not found' }, { status: 404 });
  return Response.json({ ok: true, workitem: publicShape(item) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const actor = { type: 'person' as const, identity: body.identity || 'u-1', display: body.display || 'Operator', roles: ['Operations Approver'] };
    const res = updateWorkItem(id, actor, {
      title: body.title,
      objective: body.objective,
      control_mode: body.control_mode,
      accountable_owner: body.accountable_owner,
    });
    if (!res.ok || !res.workitem) return Response.json(res, { status: 400 });
    return Response.json({ ok: true, workitem: publicShape(res.workitem) });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

// Stage actions: capture/understand/plan/check/approve/execute/verify/record/learn
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    if (!body.stage || !body.action) {
      return Response.json({ ok: false, error: 'stage and action are required.' }, { status: 400 });
    }
    const actor = {
      type: 'person' as const,
      identity: body.identity || 'u-1',
      display: body.display || 'Operator',
      roles: (body.roles as string[]) || ['Operations Approver'],
    };
    const res = actStage(id, body.stage, body.action, actor, {
      note: body.note,
      decision: body.decision,
      approval_id: body.approval_id,
      follow_ups: body.follow_ups,
      outcome: body.outcome,
    });
    if (res.decisions) {
      return Response.json({ ...res, decisions: res.decisions }, { status: res.ok ? 200 : 422 });
    }
    if (!res.ok) return Response.json(res, { status: 422 });
    return Response.json(res);
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}