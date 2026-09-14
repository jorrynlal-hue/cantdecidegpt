import zlib from 'node:zlib';
import { extractText as unpdfExtractText } from 'unpdf';

interface Stream {
  raw: Buffer;
}

// Splits a PDF into its object streams and reports which carry a FlateDecode
// filter. Text PDFs (Word/Canva export, scrapes, etc.) expose their content as
// operator streams, which we then tokenise into readable text.
function findStreams(buf: Buffer): Stream[] {
  const streams: Stream[] = [];
  const body = buf.toString('latin1');
  const re = /(\d+)\s+(\d+)\s+obj\b([\s\S]*?)\bstream\r?\n([\s\S]*?)\bendstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const header = m[3] ?? '';
    const raw = (m[4] ?? '').replace(/\r?\n$/, '');
    const filtered =
      /\/Filter\s*\/FlateDecode/.test(header) || /\/Filter\s*\[[^\]]*FlateDecode/.test(header);
    let bytes: Buffer;
    try {
      bytes = Buffer.from(raw, 'latin1');
      if (filtered) bytes = zlib.inflateSync(bytes);
    } catch {
      continue;
    }
    streams.push({ raw: bytes });
  }
  return streams;
}

// Minimal PDF content-stream interpreter for text-showing operators
// (Tj, TJ, ', ") with positioning operators for line breaks and spacing.
export function extractPdfText(buf: Buffer): string {
  const streams = findStreams(buf);
  const pages: string[] = [];
  for (const s of streams) {
    const text = parseContentStream(s.raw.toString('latin1'));
    if (text.trim().length > 0) pages.push(text.trim());
  }
  return pages.join('\n\n');
}

// Robust extraction via unpdf/pdfjs. Handles object streams, embedded fonts,
// and image-heavy exports that the minimal operator parser cannot read.
// Falls back to the homegrown parser if unpdf returns nothing usable.
export async function extractPdfTextRobust(buf: Buffer): Promise<string> {
  try {
    const result = await unpdfExtractText(new Uint8Array(buf));
    const text = Array.isArray(result.text) ? result.text.join('\n\n') : '';
    if (text.trim().length > 80) return text;
  } catch {
    // fall through to the local parser
  }
  return extractPdfText(buf);
}

interface Tok {
  t: 'str' | 'num' | 'name' | 'kw';
  v: string;
}

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '%') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f' || c === '\0') {
      i++;
      continue;
    }
    if (c === '(') {
      let depth = 0;
      let j = i;
      let s = '';
      while (j < n) {
        const ch = src[j];
        if (ch === '\\') {
          const nx = src[j + 1];
          if (nx === 'n') s += '\n';
          else if (nx === 'r') s += '\r';
          else if (nx === 't') s += '\t';
          else if (nx === 'b') s += '\b';
          else if (nx === 'f') s += '\f';
          else if (nx === '(' || nx === ')' || nx === '\\') s += nx;
          else if (/\d/.test(nx ?? '')) {
            let k = j + 1;
            let oc = '';
            while (k < n && k < j + 4 && /\d/.test(src[k])) oc += src[k++];
            s += String.fromCharCode(parseInt(oc, 8));
            j = k - 1;
          }
          j += 2;
          continue;
        }
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth <= 0) {
            j++;
            break;
          }
        }
        s += ch;
        j++;
      }
      out.push({ t: 'str', v: s });
      i = j;
      continue;
    }
    if (c === '[' || c === ']') {
      out.push({ t: 'kw', v: c });
      i++;
      continue;
    }
    if (c === '/') {
      let j = i + 1;
      while (j < n && !/\s/.test(src[j])) j++;
      out.push({ t: 'name', v: src.slice(i + 1, j) });
      i = j;
      continue;
    }
    if (c === '-' || c === '+' || /[0-9.]/.test(c)) {
      let j = i;
      while (j < n && /[-+0-9.]/.test(src[j])) j++;
      out.push({ t: 'num', v: src.slice(i, j) });
      i = j;
      continue;
    }
    let j = i;
    while (j < n && /[A-Za-z'*]/.test(src[j])) j++;
    if (j > i) {
      out.push({ t: 'kw', v: src.slice(i, j) });
      i = j;
      continue;
    }
    i++;
  }
  return out;
}

function parseContentStream(src: string): string {
  const toks = tokenize(src);
  const lines: string[] = [];
  let cur = '';
  let lastStr = '';

  const flush = (newline: string) => {
    if (cur.trim().length > 0) {
      lines.push(cur.trim());
      if (newline) lines.push(newline);
    }
    cur = '';
  };

  for (const t of toks) {
    if (t.t === 'str') {
      lastStr = t.v;
      continue;
    }
    if (t.t === 'num') {
      continue;
    }
    if (t.t === 'kw') {
      const kw = t.v;
      if (kw === 'Tj' || kw === "'" || kw === '"') {
        if (lastStr) {
          cur += lastStr + ' ';
          lastStr = '';
        }
      } else if (kw === 'TJ') {
        lastStr = '';
      } else if (kw === 'Td' || kw === 'TD' || kw === 'T*') {
        lastStr = '';
        cur = cur.trimEnd();
        cur += '\n';
      } else if (kw === 'ET' || kw === 'BT') {
        flush('\n');
        lastStr = '';
      } else if (kw === 'Tm') {
        cur = cur.trimEnd();
        cur += '\n';
        lastStr = '';
      } else if (kw === 'Tf') {
        cur = cur.trimEnd();
        cur += ' ';
        lastStr = '';
      } else {
        lastStr = '';
      }
    }
  }
  flush('');
  return lines.join('');
}