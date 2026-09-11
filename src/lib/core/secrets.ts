import fs from 'node:fs';
import path from 'node:path';

// Server-side live-provider credentials. Stored outside the document DB so they
// are never mixed with business records, and masked (never echoed) in every
// API response. File lives under .data/ which is gitignored.

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'secrets.json');

export interface OpenAISecrets {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface Secrets {
  openai: OpenAISecrets;
}

function readFile(): Secrets {
  try {
    if (!fs.existsSync(FILE)) return { openai: {} };
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Secrets>;
    return { openai: { ...(parsed.openai ?? {}) } };
  } catch {
    return { openai: {} };
  }
}

function writeFile(s: Secrets): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
}

export function getOpenAI(): OpenAISecrets {
  // env vars are canonical; stored file supplements (and can override) them
  const s = readFile().openai;
  return {
    apiKey: s.apiKey || process.env.OPENAI_API_KEY || undefined,
    baseUrl: s.baseUrl || process.env.OPENAI_BASE_URL || undefined,
    model: s.model || process.env.OPENAI_MODEL || undefined,
  };
}

export function setOpenAI(input: OpenAISecrets): void {
  const s = readFile();
  s.openai = { ...s.openai, ...input };
  writeFile(s);
}

export function clearOpenAI(): void {
  const s = readFile();
  s.openai = {};
  writeFile(s);
}

export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '*'.repeat(key.length);
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}