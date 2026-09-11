import { computeStats } from '@/lib/uiol/engine';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ ok: true, stats: computeStats() });
}