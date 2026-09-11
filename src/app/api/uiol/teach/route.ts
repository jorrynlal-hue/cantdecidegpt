import { NextRequest } from 'next/server';
import { requireSession, ok, fromError } from '@/lib/core/api/helpers';
import { createKnowledge } from '@/lib/core/engine/docs';
import { TEACH_SCOPES, MEMORY_CATEGORY_KIND, MemoryCategory } from '@/lib/uiol/layer';

export const runtime = 'nodejs';

// Teach AI: remember a preference/rule/pattern with a scope (always / project / once).
// Always → stored in Work Memory under the mapped category. Once → acknowledged, not stored.
export async function POST(req: NextRequest) {
  try {
    const { db, ctx } = await requireSession();
    const body = await req.json().catch(() => ({}));
    const statement: string = String(body.statement || '').trim();
    if (!statement) return Response.json({ ok: false, error: 'statement is required.' }, { status: 400 });

    const scope = TEACH_SCOPES.find((s) => s.id === body.scope)?.id ?? 'once';
    const category: MemoryCategory = (body.category as MemoryCategory) || 'preferences';
    const project = body.project ? String(body.project).trim() : undefined;

    let stored = '';
    if (scope !== 'once') {
      const kind = MEMORY_CATEGORY_KIND[category];
      const tags = ['preference', category, scope === 'project' ? 'project' : 'global'];
      if (project) tags.push(project);
      const created = createKnowledge(ctx, db, {
        title: statement.length > 60 ? statement.slice(0, 60) + '…' : statement,
        kind,
        content: statement + (project ? `\n(scoped to ${project})` : ''),
        tags,
      });
      stored = created.id;
    }

    return ok({
      stored,
      scope,
      note: scope === 'once' ? 'Not stored — only this time.' : `Remembered as ${category} (${scope}).`,
    });
  } catch (e) {
    return fromError(e);
  }
}