import { extractPdfTextRobust } from '@/lib/postmaker/pdf';
import { extractZipEntries, readZipEntry } from '@/lib/postmaker/zip';

export interface IntakeFileResult {
  name: string;
  kind: string;
  size: number;
  chars: number;
  text: string;
  extracted: boolean;
}

export interface BriefingChange {
  when: string;
  what: string;
}

export interface IntakeBriefing {
  title: string;
  started: string;
  going: string;
  changes: BriefingChange[];
  files: { name: string; kind: string; size: number; chars: number }[];
}

const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'eml', 'html', 'htm', 'log', 'ini', 'yml', 'yaml', 'xml', 'rtf', 'text', 'cfg',
]);

const MAX_FILE_TEXT = 150000;

function cleanText(raw: string): string {
  return raw
    .replace(/\u0000/g, ' ')
    .replace(/\f/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function xmlStrip(src: string): string {
  return src
    .replace(/<w:p[^>]*>/g, '\n\n')
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function zipXmlText(buf: Buffer, entryNames: string[]): string {
  const entries = extractZipEntries(buf);
  const targets = entries.filter((e) => entryNames.some((n) => e.name === n || e.name.startsWith(n)));
  const parts: string[] = [];
  for (const t of targets) {
    try {
      const s = xmlStrip(readZipEntry(buf, t).toString('utf8'));
      if (s.trim().length > 0) parts.push(s.trim());
    } catch {
      // skip unreadable entry
    }
  }
  return parts.join('\n\n');
}

function slideXmlText(buf: Buffer): string {
  const entries = extractZipEntries(buf);
  const slides = entries
    .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.name))
    .sort((a, b) => {
      const na = Number((a.name.match(/slide(\d+)/) ?? [0, '0'])[1]);
      const nb = Number((b.name.match(/slide(\d+)/) ?? [0, '0'])[1]);
      return na - nb;
    });
  const parts: string[] = [];
  for (const s of slides) {
    try {
      const t = xmlStrip(readZipEntry(buf, s).toString('utf8'));
      if (t.trim().length > 0) parts.push(`Slide — ${s.name.replace(/^ppt\/slides\//, '')}\n${t.trim()}`);
    } catch {
      // skip unreadable slide
    }
  }
  return parts.join('\n\n');
}

function sharedStringsText(buf: Buffer): string {
  const entries = extractZipEntries(buf);
  const t = entries.find((e) => e.name === 'xl/sharedStrings.xml');
  if (!t) return '';
  try {
    return xmlStrip(readZipEntry(buf, t).toString('utf8'));
  } catch {
    return '';
  }
}

function decodeText(buf: Buffer): string {
  const utf8 = buf.toString('utf8');
  if (utf8.length === 0) return utf8;
  const bad = utf8.split('').filter((c) => c === '\uFFFD').length;
  return bad / utf8.length > 0.2 ? buf.toString('latin1') : utf8;
}

export async function extractIntakeFileText(name: string, buf: Buffer): Promise<IntakeFileResult> {
  const size = buf.byteLength;
  const ext = (name.split('.').pop() ?? 'file').toLowerCase();
  let kind = ext;
  let text = '';
  let extracted = false;
  const trimmed = name.trim();

  if (TEXT_EXTS.has(ext)) {
    text = cleanText(decodeText(buf));
    extracted = text.length > 0;
  } else if (ext === 'pdf' || buf.subarray(0, 5).toString('latin1') === '%PDF-') {
    kind = 'pdf';
    try {
      const raw = await extractPdfTextRobust(buf);
      text = cleanText(raw).slice(0, MAX_FILE_TEXT);
      extracted = text.length > 0;
    } catch {
      text = '';
    }
  } else if (ext === 'docx' || ext === 'pptx' || ext === 'xlsx' || isZipPrefix(buf)) {
    const low = trimmed.toLowerCase();
    const entries = extractZipEntries(buf);
    const hasSlides = entries.some((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.name));
    const hasStrings = entries.some((e) => e.name === 'xl/sharedStrings.xml');
    const hasDocXml = entries.some((e) => e.name === 'word/document.xml');
    if (hasSlides || low.endsWith('.pptx')) {
      kind = 'pptx';
      const raw = slideXmlText(buf);
      text = cleanText(raw).slice(0, MAX_FILE_TEXT);
      extracted = text.length > 0;
    } else if (hasStrings || low.endsWith('.xlsx')) {
      kind = 'xlsx';
      const raw = sharedStringsText(buf);
      text = cleanText(raw).slice(0, MAX_FILE_TEXT);
      extracted = text.length > 0;
    } else if (hasDocXml || low.endsWith('.docx')) {
      kind = 'docx';
      const raw = zipXmlText(buf, ['word/document.xml']);
      text = cleanText(raw).slice(0, MAX_FILE_TEXT);
      extracted = text.length > 0;
    } else {
      kind = 'zip';
      const raw = zipXmlText(buf, ['word/document.xml']);
      text = cleanText(raw).slice(0, MAX_FILE_TEXT);
      extracted = text.length > 0;
    }
  }
  return { name, kind, size, chars: text.length, text, extracted };
}

function isZipPrefix(buf: Buffer): boolean {
  return buf.length > 4 && buf.readUInt32LE(0) === 0x04034b50;
}

function sentences(body: string): string[] {
  const raw = body
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 40 && s.length < 420);
  return raw;
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const RELATIVE_DATES = /\b(today|yesterday|this week|last week|this month|last month|earlier this week)\b/gi;

interface FoundDate {
  label: string;
  ts: number | null;
  index: number;
  sentence: string;
}

function collectDated(body: string): FoundDate[] {
  const out: FoundDate[] = [];
  const numeric = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = numeric.exec(body)) !== null) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      out.push({ label: m[0], ts: new Date(y, mo - 1, d).getTime(), index: m.index, sentence: sentenceAt(body, m.index) });
    }
  }
  const month = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/gi;
  while ((m = month.exec(body)) !== null) {
    const mo = MONTHS[(m[1] ?? '').toLowerCase()];
    const d = Number(m[2]);
    const y = m[3] ? Number(m[3]) : null;
    out.push({
      label: m[0],
      ts: y && mo && d >= 1 && d <= 31 ? new Date(y, mo - 1, d).getTime() : null,
      index: m.index,
      sentence: sentenceAt(body, m.index),
    });
  }
  while ((m = RELATIVE_DATES.exec(body)) !== null) {
    out.push({ label: m[0].toLowerCase(), ts: null, index: m.index, sentence: sentenceAt(body, m.index) });
  }
  return out;
}

function sentenceAt(body: string, index: number): string {
  const start = body.lastIndexOf('\n', index - 1) + 1;
  let end = body.indexOf('\n', index);
  if (end < 0) end = body.length;
  if (end - start <= 260) return body.slice(start, end).replace(/\s+/g, ' ').trim().slice(0, 300);
  const from = Math.max(start, index - 70);
  const to = Math.min(end, index + 190);
  return body.slice(from, to).replace(/\s+/g, ' ').trim().slice(0, 300);
}

export function buildIntakeBriefing(projectName: string, files: IntakeFileResult[]): IntakeBriefing {
  const usable = files.filter((f) => f.extracted && f.chars > 0);
  const body = usable.map((f) => `\n--- ${f.name} ---\n${f.text}`).join('\n');
  const sents = sentences(body);
  const started = sents.slice(0, 2).join(' ');
  const going = sents.slice(-2).join(' ');

  const dated = collectDated(body);
  const withTs = dated.filter((d) => d.ts !== null).sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0) || a.index - b.index);
  const withoutTs = dated.filter((d) => d.ts === null).sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  const changes: BriefingChange[] = [];
  for (const d of [...withTs, ...withoutTs]) {
    if (changes.length >= 8) break;
    if (seen.has(d.label)) continue;
    seen.add(d.label);
    const when = d.ts !== null ? new Date(d.ts).toISOString().slice(0, 10) : d.label;
    changes.push({ when, what: d.sentence || d.label });
  }

  return {
    title: `Progress briefing — ${projectName}`,
    started:
      started ||
      (usable.length > 0
        ? 'Files were accepted into the project. The system read them for context; ask the AI in this project to build the story from its files.'
        : 'Files accepted, but no readable text was extracted from them yet. Add text, PDF or DOCX files to get a written briefing.'),
    going:
      going ||
      (usable.length > 0
        ? 'Reading of the accepted files is complete. The project is ready — open the flow, review the notes, and approve the next actions.'
        : 'The project exists and is waiting. Upload spreadsheets, slides, PDFs or documents so the briefing can summarise progress.'),
    changes,
    files: files.map((f) => ({ name: f.name, kind: f.kind, size: f.size, chars: f.chars })),
  };
}