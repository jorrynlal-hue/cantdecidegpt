import { DB, Ctx, DocumentRecord, KnowledgeItem, ContentRecord } from '../types';
import { now, uid, persist } from '../db';
import { requireRole, listRows, nonEmpty, optStr, num, logActivity } from './core';
import { emitEvent } from '../events';

// ---------- documents ----------

export function listDocuments(db: DB, workspaceId: string, f: { folder?: string; kind?: string; q?: string } = {}): DocumentRecord[] {
  return listRows<DocumentRecord>(db.documents, {
    workspaceId,
    q: f.q,
    searchFields: ['name', 'text'],
    sortBy: 'createdAt',
    sortDir: 'desc',
    filter: (d) =>
      (f.folder === undefined || d.folder === f.folder) &&
      (f.kind === undefined || d.kind === f.kind),
  });
}

export function getDocument(db: DB, workspaceId: string, docId: string): DocumentRecord {
  const d = db.documents.find((x) => x.id === docId && x.workspaceId === workspaceId);
  if (!d) throw Error('NOT_FOUND');
  return d;
}

export interface DocumentInput {
  name: string;
  kind?: string;
  size?: number;
  text?: string;
  folder?: string;
  uploadedBy?: string;
}

export function createDocument(ctx: Ctx, db: DB, input: DocumentInput): DocumentRecord {
  requireRole(ctx, 'member');
  const doc: DocumentRecord = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    name: nonEmpty(input.name, 'name'),
    kind: optStr(input.kind) ?? 'file',
    size: num(input.size),
    text: optStr(input.text),
    folder: optStr(input.folder),
    uploadedBy: input.uploadedBy ?? ctx.user.id,
    createdAt: now(),
  };
  db.documents.push(doc);
  logActivity(ctx, db, { action: 'document.create', result: `Uploaded "${doc.name}"`, objectType: 'document', objectId: doc.id, objectLabel: doc.name });
  emitEvent(ctx, db, 'new_document', { documentId: doc.id, name: doc.name, kind: doc.kind });
  persist(db);
  return doc;
}

export function updateDocument(ctx: Ctx, db: DB, docId: string, patch: { name?: string; folder?: string; kind?: string; text?: string }): DocumentRecord {
  requireRole(ctx, 'member');
  const d = getDocument(db, ctx.workspaceId, docId);
  if (patch.name !== undefined) d.name = nonEmpty(patch.name, 'name');
  if (patch.folder !== undefined) d.folder = optStr(patch.folder);
  if (patch.kind !== undefined) d.kind = optStr(patch.kind) ?? d.kind;
  if (patch.text !== undefined) d.text = optStr(patch.text);
  persist(db);
  return d;
}

export function deleteDocument(ctx: Ctx, db: DB, docId: string): void {
  requireRole(ctx, 'manager');
  const d = getDocument(db, ctx.workspaceId, docId);
  db.documents = db.documents.filter((x) => x.id !== docId);
  logActivity(ctx, db, { action: 'document.delete', result: `Deleted "${d.name}"`, objectType: 'document', objectId: docId, objectLabel: d.name });
  persist(db);
}

export interface DocSearchResult {
  id: string;
  workspaceId: string;
  name: string;
  kind: string;
  snippet: string;
  relevance: number;
}

// Document AI search: rank documents by extracted-text keyword matches.
export function searchDocuments(db: DB, workspaceId: string, query: string): DocSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const results: DocSearchResult[] = [];
  for (const d of db.documents.filter((x) => x.workspaceId === workspaceId)) {
    const hay = `${d.name} ${d.text ?? ''}`.toLowerCase();
    const hits = terms.filter((t) => hay.includes(t)).length;
    if (hits > 0) {
      const idx = (d.text ?? '').toLowerCase().indexOf(terms[0]);
      const snippet = idx >= 0 ? (d.text ?? '').slice(Math.max(0, idx - 40), idx + 120) : d.name;
      results.push({ id: d.id, workspaceId: d.workspaceId, name: d.name, kind: d.kind, snippet, relevance: hits / terms.length });
    }
  }
  return results.sort((a, b) => b.relevance - a.relevance);
}

// ---------- knowledge ----------

export function listKnowledge(db: DB, workspaceId: string, f: { kind?: string; tag?: string; q?: string } = {}): KnowledgeItem[] {
  return listRows<KnowledgeItem>(db.knowledge, {
    workspaceId,
    q: f.q,
    searchFields: ['title', 'content'],
    sortBy: 'updatedAt',
    sortDir: 'desc',
    filter: (k) =>
      (f.kind === undefined || k.kind === f.kind) &&
      (f.tag === undefined || k.tags.includes(f.tag)),
  });
}

export function getKnowledge(db: DB, workspaceId: string, id: string): KnowledgeItem {
  const k = db.knowledge.find((x) => x.id === id && x.workspaceId === workspaceId);
  if (!k) throw Error('NOT_FOUND');
  return k;
}

export interface KnowledgeInput {
  title: string;
  kind?: string;
  content: string;
  tags?: string[];
}

export function createKnowledge(ctx: Ctx, db: DB, input: KnowledgeInput): KnowledgeItem {
  requireRole(ctx, 'member');
  const kind = input.kind === 'note' || input.kind === 'process' || input.kind === 'instruction' || input.kind === 'reference' || input.kind === 'knowledge' ? input.kind : 'note';
  const item: KnowledgeItem = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    title: nonEmpty(input.title, 'title'),
    kind,
    content: nonEmpty(input.content, 'content'),
    tags: [...new Set((input.tags ?? []).map((t) => t.trim()).filter(Boolean))],
    createdBy: ctx.user.id,
    createdAt: now(),
    updatedAt: now(),
  };
  db.knowledge.push(item);
  logActivity(ctx, db, { action: 'knowledge.create', result: `Saved knowledge "${item.title}"`, objectType: 'knowledge', objectId: item.id, objectLabel: item.title });
  persist(db);
  return item;
}

export function updateKnowledge(ctx: Ctx, db: DB, id: string, patch: Partial<KnowledgeInput>): KnowledgeItem {
  requireRole(ctx, 'member');
  const item = getKnowledge(db, ctx.workspaceId, id);
  if (patch.title !== undefined) item.title = nonEmpty(patch.title, 'title');
  if (patch.kind !== undefined) item.kind = item.kind;
  if (patch.content !== undefined) item.content = nonEmpty(patch.content, 'content');
  if (patch.tags !== undefined) item.tags = [...new Set(patch.tags.map((t) => t.trim()).filter(Boolean))];
  item.updatedAt = now();
  persist(db);
  return item;
}

export function deleteKnowledge(ctx: Ctx, db: DB, id: string): void {
  requireRole(ctx, 'manager');
  const item = getKnowledge(db, ctx.workspaceId, id);
  db.knowledge = db.knowledge.filter((x) => x.id !== id);
  logActivity(ctx, db, { action: 'knowledge.delete', result: `Deleted "${item.title}"`, objectType: 'knowledge', objectId: id });
  persist(db);
}

// ---------- content ----------

export function listContent(db: DB, workspaceId: string, f: { kind?: string; q?: string } = {}): ContentRecord[] {
  return listRows<ContentRecord>(db.content, {
    workspaceId,
    q: f.q,
    searchFields: ['title', 'body'],
    sortBy: 'savedAt',
    sortDir: 'desc',
    filter: (c) => (f.kind === undefined || c.kind === f.kind),
  });
}

export function saveContent(ctx: Ctx, db: DB, input: { title: string; kind?: string; body: string; tone?: string }): ContentRecord {
  requireRole(ctx, 'member');
  const rec: ContentRecord = {
    id: uid(),
    workspaceId: ctx.workspaceId,
    title: nonEmpty(input.title, 'title'),
    kind: optStr(input.kind) ?? 'article',
    body: nonEmpty(input.body, 'body'),
    tone: optStr(input.tone) ?? 'neutral',
    savedAt: now(),
    createdBy: ctx.user.id,
  };
  db.content.push(rec);
  logActivity(ctx, db, { action: 'content.save', result: `Saved content "${rec.title}"`, objectType: 'content', objectId: rec.id, objectLabel: rec.title });
  persist(db);
  return rec;
}

export function deleteContent(ctx: Ctx, db: DB, id: string): void {
  requireRole(ctx, 'manager');
  db.content = db.content.filter((c) => c.id !== id && c.workspaceId === ctx.workspaceId);
  persist(db);
}