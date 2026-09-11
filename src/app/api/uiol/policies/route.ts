import { NextRequest } from 'next/server';
import { listPolicies, evaluateAction } from '@/lib/uiol/engine';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ ok: true, policies: listPolicies() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = evaluateAction({
      workitem_id: body.workitem_id,
      action: body.action,
      amount: body.amount,
      role: body.role,
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}