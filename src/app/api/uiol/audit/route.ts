import { NextRequest } from 'next/server';
import { loadDB } from '@/lib/uiol/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const db = loadDB();
  const workitem_id = req.nextUrl.searchParams.get('workitem_id');
  const actor = req.nextUrl.searchParams.get('actor');
  const limit = Number(req.nextUrl.searchParams.get('limit') || 200);

  let events = db.audit.slice().sort((a, b) => b.at.localeCompare(a.at));
  if (workitem_id) events = events.filter((e) => e.workitem_id === workitem_id);
  if (actor) events = events.filter((e) => e.actor.identity === actor || e.actor.display.includes(actor));
  events = events.slice(0, limit);

  return Response.json({ ok: true, events, total: db.audit.length });
}