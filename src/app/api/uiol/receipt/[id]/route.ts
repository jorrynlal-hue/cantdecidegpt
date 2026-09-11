import { decisionReceipt } from '@/lib/uiol/engine';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const receipt = decisionReceipt(id);
  if (!receipt) return Response.json({ ok: true, receipt: null });
  return Response.json({ ok: true, receipt });
}