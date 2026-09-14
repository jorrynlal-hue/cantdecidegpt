import fs from 'node:fs';
import path from 'node:path';
import { extractPdfTextRobust } from './pdf';
import { extractZipEntries, readZipEntry } from './zip';
import type { DocRecord, DocMeta, KnowledgeView, FlowGraph } from './types';
import { buildFlowGraph } from './flowchart';

const DOCS_DIR = path.join(process.cwd(), 'postmaker-docs');
const DATA_DIR = path.join(process.cwd(), 'postmaker-data');
const KB_FILE = path.join(DATA_DIR, 'knowledge.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');
const MAX_SKIP_NAMES = ['README.txt', 'README.md'];
const MAX_BODY = 400000;

// Docs that must be read in full (word for word) ahead of everything else.
const PRIORITY_NAMES = ['10-10-product-post-playbook.pdf', 'product-post-guide.docx', 'first_post_100_sales_playbook.pdf'];
const DIGEST_BUDGET = 100000;
const PRIORITY_CAP = 40000;
const REST_CAP = 15000;

export const docsDirPath = DOCS_DIR;

export function ensureDirs(): void {
  for (const d of [DOCS_DIR, DATA_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function cleanText(raw: string): string {
  return raw
    .replace(/\u0000/g, ' ')
    .replace(/\f/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function statusFor(text: string, size: number): DocMeta['status'] {
  const t = text.trim();
  if (t.length === 0) return size > 0 ? 'empty' : 'unsupported';
  if (t.length < 120 && size > 6000) return 'low';
  const letters = (t.match(/[a-zA-Z]/g) ?? []).length;
  if (letters === 0 || letters / t.length < 0.55) return 'low';
  return 'ok';
}

function docxXmlToText(xml: string): string {
  return xml
    .replace(/<w:p[^>]*>/g, '\n\n')
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

async function extractOne(name: string, ext: string): Promise<{ text: string; status: DocMeta['status'] }> {
  const buf = fs.readFileSync(path.join(DOCS_DIR, name));
  let raw = '';
  if (ext === '.txt' || ext === '.md' || ext === '.csv' || ext === '.html' || ext === '.htm') {
    raw = buf.toString('utf8');
  } else if (ext === '.pdf') {
    try {
      raw = await extractPdfTextRobust(buf);
    } catch {
      raw = '';
    }
  } else if (ext === '.docx') {
    try {
      const entries = extractZipEntries(buf);
      const doc = entries.find((e) => e.name === 'word/document.xml');
      if (doc) raw = docxXmlToText(readZipEntry(buf, doc).toString('utf8'));
    } catch {
      raw = '';
    }
  } else {
    return { text: '', status: 'unsupported' };
  }
  const text = cleanText(raw).slice(0, MAX_BODY);
  return { text, status: statusFor(text, buf.length) };
}

export async function rescanKb(): Promise<DocRecord[]> {
  ensureDirs();
  const names = fs.readdirSync(DOCS_DIR).filter((f) => !f.startsWith('.') && !MAX_SKIP_NAMES.includes(f));
  const docs: DocRecord[] = [];
  for (const name of names) {
    const ext = path.extname(name).toLowerCase();
    const p = path.join(DOCS_DIR, name);
    let size = 0;
    let updated = 0;
    try {
      const st = fs.statSync(p);
      if (!st.isFile()) continue;
      size = st.size;
      updated = Math.round(st.mtimeMs);
    } catch {
      continue;
    }
    const { text, status } = await extractOne(name, ext);
    docs.push({ name, ext, size, chars: text.length, updated, status, excerpt: text.slice(0, 160), text });
  }
  fs.writeFileSync(KB_FILE, JSON.stringify({ docs, builtAt: Date.now() }, null, 2), 'utf8');
  if (docs.length === 0) seedReadme();
  return docs;
}

export async function readKb(): Promise<DocRecord[]> {
  ensureDirs();
  try {
    if (!fs.existsSync(KB_FILE)) return rescanKb();
    const raw = JSON.parse(fs.readFileSync(KB_FILE, 'utf8')) as { docs: DocRecord[] };
    return Array.isArray(raw.docs) ? raw.docs : [];
  } catch {
    return rescanKb();
  }
}

function seedReadme(): void {
  const p = path.join(DOCS_DIR, 'README.txt');
  if (fs.existsSync(p)) return;
  fs.writeFileSync(
    p,
    'LOCAL POST MAKER KNOWLEDGE FOLDER\n\nDrop files here and press "Reload knowledge":\n' +
      '  .pdf  .docx  .txt  .md  .csv  .html\n\n' +
      'Everything is read locally on this computer. Nothing is uploaded.\n',
    'utf8',
  );
}

const STOP = new Set(
  (
    'a,an,the,and,but,or,for,nor,on,at,in,to,from,by,with,of,is,are,was,were,be,been,being,' +
    'this,that,these,those,it,its,them,they,you,your,we,our,us,i,my,me,he,she,his,her,their,' +
    'as,so,if,then,than,when,where,which,who,whom,what,how,why,not,no,yes,will,would,can,could,' +
    'should,may,might,must,do,does,did,has,have,having,had,about,into,over,under,again,once,too,' +
    'very,just,also,more,most,such,only,own,same,other,each,new,used,use,using,one,two,three,' +
    "per,via,plus,et,al,vs,etc,e.g.,i.e.,ll,ve,re,don't,can't,work,people,works,day"
  ).split(','),
);

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z]{3,}/g) ?? [];
}

function topFacts(text: string, limit: number): string[] {
  const sents = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 40 && s.length < 320);
  const counted = new Map<string, number>();
  for (const s of sents) {
    const w = words(s);
    const bigrams = new Set<string>();
    for (let i = 0; i < w.length - 1; i++) {
      if (STOP.has(w[i]) || STOP.has(w[i + 1])) continue;
      bigrams.add(`${w[i]} ${w[i + 1]}`);
    }
    for (const b of bigrams) counted.set(b, (counted.get(b) ?? 0) + 1);
  }
  const top = [...counted.entries()].sort((a, b) => b[1] - a[1]).slice(0, Math.min(8, limit));
  const picks = new Set<string>();
  for (const [b] of top) {
    if (picks.size >= limit) break;
    const hit = sents.find((s) => s.includes(b) && !picks.has(s));
    if (hit) picks.add(hit);
  }
  return [...picks].slice(0, limit);
}

export function readProfile(): { brief: string; updatedAt: number } | null {
  try {
    if (!fs.existsSync(PROFILE_FILE)) return null;
    return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf8')) as { brief: string; updatedAt: number };
  } catch {
    return null;
  }
}

export function saveProfile(p: { brief: string }): void {
  ensureDirs();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify({ ...p, updatedAt: Date.now() }, null, 2), 'utf8');
}

export async function knowledgeView(): Promise<KnowledgeView> {
  const docs = await readKb();
  const profile = readProfile();
  const okDocs = docs.filter((d) => d.status === 'ok');
  const body = okDocs.slice(0, 6).map((d) => d.text).join('\n\n');
  const facts = topFacts(body, 6);
  const totalChars = docs.reduce((a, d) => a + d.chars, 0);
  const lowConfidence = docs.filter((d) => d.status === 'low' || d.status === 'empty').length;
  const n = okDocs.length;
  const summary =
    n === 0
      ? 'No usable documents loaded yet. Drop PDFs, DOCX or text files into the postmaker-docs folder and reload.'
      : `Knowledge loaded from ${n} document${n === 1 ? '' : 's'} (${Math.round(totalChars / 1000)}k characters). ` +
        (facts.length > 0 ? `Key themes detected: ${facts.slice(0, 2).map((f) => f.slice(0, 60)).join(' · ')}` : '');
  const flow: FlowGraph = buildFlowGraph();
  return {
    docs: docs.map((d) => ({ name: d.name, ext: d.ext, size: d.size, chars: d.chars, updated: d.updated, status: d.status, excerpt: d.excerpt })),
    builtAt: 0,
    stats: { totalChars, totalDocs: docs.length, lowConfidence },
    summary,
    facts,
    profile,
    flow,
  };
}

export async function fullKnowledgeText(): Promise<string> {
  const docs = await readKb();
  return docs
    .filter((d) => d.status === 'ok')
    .map((d) => `--- ${d.name} ---\n${d.text}`)
    .join('\n\n');
}

// Ordered digest for the generation prompt: playbooks and guides first and in
// full, then the general curriculum capped so the total stays inside the
// model's context window. This is what makes the writer "read it all up".
export async function knowledgeDigest(): Promise<string> {
  const docs = await readKb();
  const ok = docs.filter((d) => d.status === 'ok');
  const ranked = [...ok].sort((a, b) => prioIndex(a.name) - prioIndex(b.name));
  const parts: string[] = [];
  let used = 0;
  for (const d of ranked) {
    if (used >= DIGEST_BUDGET) break;
    const isPrio = PRIORITY_NAMES.includes(d.name);
    const cap = isPrio ? PRIORITY_CAP : REST_CAP;
    const room = DIGEST_BUDGET - used;
    const budget = Math.min(cap, room);
    const header = `\n===== ${d.name} =====\n`;
    const body = d.text.slice(0, Math.max(0, budget - header.length));
    parts.push(header + body);
    used += header.length + body.length;
  }
  return parts.join('\n').trim();
}

function prioIndex(name: string): number {
  const i = PRIORITY_NAMES.indexOf(name);
  return i === -1 ? PRIORITY_NAMES.length + 1 : i;
}