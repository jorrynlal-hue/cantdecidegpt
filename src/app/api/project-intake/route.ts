import { requireSession, ok, fail, fromError } from '@/lib/core/api/helpers';
import * as work from '@/lib/core/engine/work';
import * as docs from '@/lib/core/engine/docs';
import { extractIntakeFileText, buildIntakeBriefing } from '@/lib/project-intake';

const MAX_FILES = 40;

export async function POST(req: Request) {
  try {
    const { db, ctx } = await requireSession();
    const form = await req.formData();
    const mode = String(form.get('mode') ?? 'new') === 'existing' ? 'existing' : 'new';
    const projectName = String(form.get('projectName') ?? '').trim();
    const projectId = String(form.get('projectId') ?? '').trim();

    const all = form.getAll('files');
    const fileEntries = all.filter((f) => f instanceof File) as File[];
    if (fileEntries.length === 0) return fail('NO_FILES', 'Choose at least one file from your computer.');
    if (fileEntries.length > MAX_FILES) return fail('TOO_MANY_FILES', `Up to ${MAX_FILES} files per intake.`);

    let project;
    let created = false;
    if (mode === 'existing') {
      if (!projectId) return fail('NO_PROJECT', 'Choose the project to add these files to.');
      project = work.getProject(db, ctx.workspaceId, projectId);
    } else {
      const fallbackName = fileEntries[0].name.replace(/\.[^.]+$/, '').trim() || 'New project from files';
      const name = projectName || fallbackName;
      const description =
        `Project intake of ${fileEntries.length} file${fileEntries.length === 1 ? '' : 's'} accepted from the computer.`;
      try {
        project = work.createProject(ctx, db, {
          name,
          description,
          status: 'planning',
          category: String(form.get('category') ?? ''),
          colour: String(form.get('colour') ?? ''),
          tier: String(form.get('tier') ?? ''),
          template: String(form.get('template') ?? ''),
        });
        created = true;
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.startsWith('PLAN_LIMIT')) {
          return fail('PLAN_LIMIT', 'Plan limit reached. Archive or delete a project, or upgrade in Plans & Billing before accepting new ones.', 400);
        }
        throw e;
      }
    }

    const projectIdFinal = project.id;
    const results = [];
    for (const f of fileEntries) {
      const buf = Buffer.from(await f.arrayBuffer());
      const res = await extractIntakeFileText(f.name, buf);
      results.push(res);
      docs.createDocument(ctx, db, {
        name: res.name,
        kind: res.kind,
        size: res.size,
        text: res.text || undefined,
        folder: `intake-${projectIdFinal}`,
      });
    }
    project.files = [...new Set([...(project.files ?? []), ...results.map((r) => r.name)])];
    project.updatedAt = new Date().toISOString();

    const briefing = buildIntakeBriefing(project.name, results);
    const content =
      `## How it started\n${briefing.started}\n\n` +
      `## How it's going\n${briefing.going}\n\n` +
      `## What changed and when\n` +
      (briefing.changes.length > 0
        ? briefing.changes.map((c) => `- ${c.when}: ${c.what}`).join('\n')
        : '- No explicit dates were found in the accepted files yet. The briefing will grow as the project moves.') +
      `\n\n## Files accepted\n` +
      briefing.files
        .map((f) => `- ${f.name} (${f.kind}) — ${fmtKB(f.size)}${f.chars > 0 ? `, ${f.chars.toLocaleString()} characters read` : ''}`)
        .join('\n');

    const knowledge = docs.createKnowledge(ctx, db, {
      title: briefing.title,
      kind: 'instruction',
      content,
      tags: [projectIdFinal, 'intake', 'briefing', 'phase'],
    });

    return ok({
      project: { id: project.id, name: project.name, status: project.status, category: project.category ?? '' },
      created,
      files: results.map((r) => ({ name: r.name, kind: r.kind, size: r.size, chars: r.chars, extracted: r.extracted })),
      briefing: { id: knowledge.id, title: knowledge.title, createdAt: knowledge.createdAt },
    }, 201);
  } catch (e) {
    return fromError(e);
  }
}

function fmtKB(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1048576) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1048576).toFixed(1)} MB`;
}