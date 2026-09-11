import { loadDB } from '@/lib/uiol/store';

export const runtime = 'nodejs';

export async function GET() {
  const db = loadDB();
  return Response.json({ ok: true, org_context: db.workitems[0]?.org_context || 'Acme Industries', templates: db.templates, users: db.users });
}