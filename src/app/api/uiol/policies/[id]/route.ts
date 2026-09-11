import { NextRequest } from 'next/server';
import { updatePolicy } from '@/lib/uiol/engine';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const p = updatePolicy(id, { enabled: body.enabled });
    if (!p) return Response.json({ ok: false, error: 'Policy not found' }, { status: 404 });
    return Response.json({ ok: true, policy: p });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}