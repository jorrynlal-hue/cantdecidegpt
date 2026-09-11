import { DB } from './types';

export interface SearchHit {
  type: string; // task | project | customer | deal | campaign | document | knowledge | content | conversation | workflow | notification | event
  id: string;
  title: string;
  subtitle?: string;
  link: string;
  score: number;
}

export interface SearchResults {
  query: string;
  hits: SearchHit[];
  groups: Record<string, SearchHit[]>;
}

function hit(
  type: string,
  id: string,
  title: string,
  subtitle: string | undefined,
  link: string,
  terms: string[],
  haystack: string,
  boost = 1
): SearchHit {
  const h = haystack.toLowerCase();
  const score = terms.reduce((acc, t) => (h.includes(t) ? acc + 1 + (h.startsWith(t) ? 2 : 0) : acc), 0) * boost;
  return { type, id, title, subtitle, link, score };
}

function termsOf(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

export function globalSearch(db: DB, workspaceId: string, query: string): SearchResults {
  const q = query.trim();
  const terms = termsOf(query);
  const results: SearchHit[] = [];
  if (!terms.length) return { query: q, hits: [], groups: {} };

  for (const t of db.tasks) {
    if (t.workspaceId !== workspaceId) continue;
    const sc = hit('task', t.id, t.title, `Task · ${t.status} · ${t.priority}`, `/dashboard/work`, terms, `${t.title} ${t.description ?? ''}`, 2);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const p of db.projects) {
    if (p.workspaceId !== workspaceId) continue;
    const sc = hit('project', p.id, p.name, `Project · ${p.status}`, `/dashboard/work`, terms, `${p.name} ${p.description ?? ''}`, 2);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const c of db.customers) {
    if (c.workspaceId !== workspaceId) continue;
    const sc = hit('customer', c.id, c.name, `Customer · ${c.type}`, `/dashboard/crm`, terms, `${c.name} ${c.email ?? ''} ${c.company ?? ''} ${c.notes ?? ''} ${c.tags.join(' ')}`, 2);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const d of db.deals) {
    if (d.workspaceId !== workspaceId) continue;
    const sc = hit('deal', d.id, d.name, `Deal · ${d.stage} · ${d.value}`, `/dashboard/crm`, terms, `${d.name} ${d.notes ?? ''}`, 2);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const c of db.campaigns) {
    if (c.workspaceId !== workspaceId) continue;
    const sc = hit('campaign', c.id, c.name, `Campaign · ${c.channel} · ${c.status}`, `/dashboard/marketing`, terms, `${c.name} ${c.description ?? ''}`, 1.5);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const d of db.documents) {
    if (d.workspaceId !== workspaceId) continue;
    const sc = hit('document', d.id, d.name, `Document · ${d.kind} · ${d.folder ?? 'root'}`, `/dashboard/docs`, terms, `${d.name} ${d.text ?? ''}`, 1.5);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const k of db.knowledge) {
    if (k.workspaceId !== workspaceId) continue;
    const sc = hit('knowledge', k.id, k.title, `Knowledge · ${k.kind}`, `/dashboard/docs`, terms, `${k.title} ${k.content} ${k.tags.join(' ')}`, 1.5);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const c of db.content) {
    if (c.workspaceId !== workspaceId) continue;
    const sc = hit('content', c.id, c.title, `Content · ${c.kind}`, `/dashboard/ai`, terms, `${c.title} ${c.body}`, 1.2);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const c of db.conversations) {
    if (c.workspaceId !== workspaceId) continue;
    const sc = hit('conversation', c.id, c.title, 'Assistant conversation', `/dashboard/ai`, terms, `${c.title} ${c.messages.map((m) => m.content).join(' ')}`, 1);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const w of db.workflows) {
    if (w.workspaceId !== workspaceId) continue;
    const sc = hit('workflow', w.id, w.name, `Automation · ${w.trigger.type}`, `/dashboard/automation`, terms, `${w.name} ${w.description ?? ''}`, 1);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const n of db.notifications) {
    if (n.workspaceId !== workspaceId) continue;
    const sc = hit('notification', n.id, n.title, `Notification · ${n.kind}`, n.link ?? '/', terms, `${n.title} ${n.body ?? ''}`, 0.5);
    if (sc.score > 0) results.push(sc as SearchHit);
  }
  for (const e of db.events) {
    if (e.workspaceId !== workspaceId) continue;
    const sc = hit('event', e.id, e.title, `Calendar event · ${e.kind}`, `/dashboard/calendar`, terms, `${e.title}`, 0.7);
    if (sc.score > 0) results.push(sc as SearchHit);
  }

  const sorted = results.sort((a, b) => b.score - a.score);
  const groups: Record<string, SearchHit[]> = {};
  for (const r of sorted) {
    (groups[r.type] ??= []).push(r);
  }
  return { query: q, hits: sorted.slice(0, 40), groups };
}