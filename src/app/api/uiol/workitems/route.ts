import { NextRequest } from 'next/server';
import { createWorkItem, listWorkItems, publicShape } from '@/lib/uiol/engine';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const stage = req.nextUrl.searchParams.get('stage') || undefined;
  const q = req.nextUrl.searchParams.get('q') || undefined;
  const res = listWorkItems({ stage, q });
  return Response.json({ ok: true, items: res.items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const actor = {
      type: 'person' as const,
      identity: body.requester_id || 'u-1',
      display: body.requester_display || 'Operator',
      roles: ['Operations Approver'],
    };
    if (!body.template_id || !body.title || !body.objective) {
      return Response.json({ ok: false, error: 'template_id, title, and objective are required.' }, { status: 400 });
    }
    const result = createWorkItem(body, actor);
    if (!result.ok || !result.workitem) return Response.json(result, { status: 400 });
    return Response.json({ ok: true, workitem: publicShape(result.workitem) }, { status: 201 });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}