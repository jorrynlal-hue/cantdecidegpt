import { NextRequest } from 'next/server';
import { listApprovals, actOnApproval, publicShape } from '@/lib/uiol/engine';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const pending = req.nextUrl.searchParams.get('pending');
  const rows = listApprovals({ pending: pending === 'true' ? 'true' : undefined });
  return Response.json({
    ok: true,
    approvals: rows.map(({ workitem, approval }) => ({
      workitem: publicShape(workitem),
      approval,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.workitem_id || !body.approval_id || !body.decision) {
      return Response.json({ ok: false, error: 'workitem_id, approval_id, decision are required.' }, { status: 400 });
    }
    const actor = {
      type: 'person' as const,
      identity: body.identity || 'u-1',
      display: body.display || 'Operator',
      roles: (body.roles as string[]) || ['Operations Approver'],
    };
    const res = actOnApproval(body.workitem_id, body.approval_id, body.decision, actor, body.note);
    if (!res.ok || !res.workitem) return Response.json({ ok: false, error: res.error || 'Failed' }, { status: 400 });
    return Response.json({ ok: true, workitem: publicShape(res.workitem) });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}