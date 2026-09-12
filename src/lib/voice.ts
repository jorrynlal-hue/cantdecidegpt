// On-mic voice system: continuous SpeechRecognition with a wake word,
// natural-language command routing, and SpeechSynthesis replies.
// All audio gates on the shared AudioPrefs (cdg.audio-prefs): the master
// `enabled` switch, volume, quiet hours and prefers-reduced-motion.
import { ALL_TOOLS, type HubTool, type RestoredTool } from '@/lib/hub';
import { loadAudioPrefs, inQuietHours, prefersReducedAudio, playTing, DEFAULT_WAKE_WORD } from '@/lib/ting';

export type { AudioPrefs } from '@/lib/ting';
export { DEFAULT_WAKE_WORD };

type Toolish = HubTool | RestoredTool;

export interface NavTarget {
  label: string;
  href: string;
}

export const VOICE_KEY = 'cdg.voice';
export const VOICE_CONVERSATION_KEY = 'cdg.voice.conversation';

// ---------------------------------------------------------------- recognition

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export type SpeechCtor = new () => SpeechRecognitionLike;

export function recognitionCtor(): SpeechCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function voiceSupported(): boolean {
  return recognitionCtor() !== null;
}

// Build a configured recognition instance. Callers wire the handlers.
export function createRecognition(overrides?: { continuous?: boolean; interimResults?: boolean; lang?: string }): SpeechRecognitionLike | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = overrides?.lang ?? 'en-US';
  rec.continuous = overrides?.continuous ?? true;
  rec.interimResults = overrides?.interimResults ?? true;
  rec.maxAlternatives = 1;
  return rec;
}

export function transcriptOf(ev: SpeechRecognitionEvent): string {
  try {
    const out: string[] = [];
    const results = ev.results;
    for (let i = 0; i < results.length; i++) {
      const alt = results[i];
      if (alt && alt.length) out.push(alt[0]?.transcript ?? '');
    }
    return out.join(' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

export function currentTranscript(ev: SpeechRecognitionEvent): string {
  try {
    const last = ev.results[ev.results.length - 1];
    return last?.[0]?.transcript ?? '';
  } catch {
    return '';
  }
}

export function isFinalPhrase(ev: SpeechRecognitionEvent): boolean {
  try {
    const last = ev.results[ev.results.length - 1];
    return Boolean(last && last.isFinal);
  } catch {
    return false;
  }
}

// ------------------------------------------------------- wake-word detection

export function wakeWordsOf(wakeWord: string): string[] {
  const primary = (wakeWord || DEFAULT_WAKE_WORD).toLowerCase().replace(/[.!,]$/, '').trim();
  const synonyms = ['hey nexus', 'hello nexus', 'ok nexus', 'okay nexus', 'nexus'];
  const list = [primary, ...synonyms.filter((s) => s !== primary && !listMatchesAll(primary, s))];
  const seen = new Set<string>();
  return list.filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return s.length > 0;
  });
}

function listMatchesAll(a: string, b: string): boolean {
  return a === b;
}

// Returns the command text following the first wake word found in `text`,
// or null when no wake word matched.
export function splitAfterWake(text: string, wakeWords: string[]): string | null {
  const t = text.toLowerCase();
  let best: { idx: number; len: number } | null = null;
  for (const w of wakeWords) {
    const idx = findWakeAtWordBoundary(t, w);
    if (idx !== -1 && (best === null || idx < best.idx)) best = { idx, len: w.length };
  }
  if (!best) return null;
  const cmd = text.slice(best.idx + best.len).replace(/^\s*[,.]?\s*/, '').trim();
  return cmd;
}

function findWakeAtWordBoundary(text: string, wake: string): number {
  const start = text.indexOf(wake);
  if (start === -1) return -1;
  const before = start === 0 ? '' : text[start - 1];
  const afterEnd = start + wake.length;
  const after = afterEnd >= text.length ? '' : text[afterEnd];
  const boundary = (c: string) => !c || /[\s.,;!?'"(){}[\]_:]/.test(c);
  return boundary(before) && boundary(after) ? start : -1;
}

// ------------------------------------------------------------ nav intents

interface VoiceRoute {
  match: (t: string) => boolean;
  label: string;
  href: string;
}

// Spoken destinations. Kept side-by-side with the toolkit name matcher below.
const VOICE_ROUTES: VoiceRoute[] = [
  { match: (t) => /overview|command center|dashboard/.test(t), label: 'Command Center', href: '/dashboard' },
  { match: (t) => /workflow builder|workflow canvas|the canvas|build a workflow/.test(t), label: 'Workflow Builder', href: '/dashboard/workspace' },
  { match: (t) => /premium radial|radial two|radial 2|radial 0 ?2/.test(t), label: 'Premium Radial', href: '/dashboard/radial02' },
  { match: (t) => /radial board|toolkit board|radial system|radial one|radial 1/.test(t), label: 'Radial Board', href: '/dashboard/radial' },
  { match: (t) => /attention|what needs me|needs attention/.test(t), label: 'Attention Required', href: '/dashboard/attention' },
  { match: (t) => /toolkits?/.test(t), label: 'Radial Toolkits', href: '/dashboard/toolkits' },
  { match: (t) => /calendar|schedule|appointments/.test(t), label: 'Calendar', href: '/dashboard/calendar' },
  { match: (t) => /approval/.test(t), label: 'Approvals', href: '/dashboard/operations/approvals' },
  { match: (t) => /plans|billing|upgrade|pricing/.test(t), label: 'Plans', href: '/dashboard/plans' },
  { match: (t) => /settings|preferences/.test(t), label: 'Settings', href: '/dashboard/settings' },
  { match: (t) => /team|people|members/.test(t), label: 'Team', href: '/dashboard/team' },
  { match: (t) => /security|permission/.test(t), label: 'Security', href: '/dashboard/security' },
  { match: (t) => /finance|money|revenue/.test(t), label: 'Finance', href: '/dashboard/finance' },
  { match: (t) => /marketing|campaign/.test(t), label: 'Marketing', href: '/dashboard/marketing' },
  { match: (t) => /automation|automate/.test(t), label: 'Automation', href: '/dashboard/automation' },
  { match: (t) => /inbox|emails?/.test(t), label: 'Inbox', href: '/dashboard/inbox' },
  { match: (t) => /tasks?|to ?do/.test(t), label: 'Tasks', href: '/dashboard/tasks' },
  { match: (t) => /voice|dictation|transcribe/.test(t), label: 'Voice Studio', href: '/dashboard/voice' },
  { match: (t) => /assistant|ai studio|run (the )?assistant/.test(t), label: 'AI Studio', href: '/dashboard/ai' },
];

export function matchVoiceNav(raw: string): NavTarget | null {
  const t = raw
    .toLowerCase()
    .replace(/^(please\s+)?(go to|open|take me to|navigate to|show me|show|bring up|load)\s+/, '')
    .replace(/^the\s+/, '')
    .replace(/[\s,]+$/, '')
    .trim();
  if (!t) return null;
  const special = VOICE_ROUTES.find((r) => r.match(t));
  if (special) return { label: special.label, href: special.href };
  const tool: Toolish | undefined = ALL_TOOLS.find(
    (x) => x.name.toLowerCase() === t || x.id === t || t.includes(x.name.toLowerCase()),
  );
  if (tool) return { label: tool.name, href: tool.href };
  return null;
}

// --------------------------------------------------------------- speech out

function stripMarkdown(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>~|#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanSpeech(text: string, max = 300): string {
  const cleaned = stripMarkdown(text.replace(/[""]/g, '"').replace(/[\u2018\u2019]/g, "'"));
  return cleaned.length > max ? `${cleaned.slice(0, max).trimEnd()}…` : cleaned;
}

export function speechVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function primeSpeechVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  // Warm the voice list on Chromium (it loads asynchronously).
  window.speechSynthesis.getVoices();
}

export function speaking(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try { window.speechSynthesis.cancel(); } catch { /* best effort */ }
}

// Speak a short system line through TTS, honouring audio preferences.
export function speak(text: string, opts?: { volume?: number; force?: boolean }): void {
  if (!text) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const prefs = loadAudioPrefs();
  if (!prefs.enabled) return;
  if (!opts?.force && (inQuietHours(prefs) || prefersReducedAudio())) return;
  try {
    const u = new SpeechSynthesisUtterance(cleanSpeech(text));
    u.volume = Math.max(0, Math.min(1, (opts?.volume ?? prefs.volume) / 100));
    u.rate = 1;
    u.pitch = 1;
    const voices = speechVoices();
    if (voices.length) {
      const v = voices.find((x) => x.default) ?? voices.find((x) => /(en[-_])?us/i.test(x.lang)) ?? voices[0];
      u.voice = v;
      u.lang = v.lang;
    } else {
      u.lang = 'en-US';
    }
    stopSpeaking();
    window.speechSynthesis.speak(u);
  } catch { /* TTS best-effort */ }
}

// "ting" alert channel for the voice assistant (respects volume/quiet/reduced).
export function voiceBeep(opts?: { volume?: number; count?: number }): void {
  const prefs = loadAudioPrefs();
  if (!prefs.enabled || inQuietHours(prefs) || prefersReducedAudio()) return;
  playTing({ volume: opts?.volume ?? prefs.volume, count: opts?.count ?? 1 });
}

// ------------------------------------------------------------- conversation

export function readConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(VOICE_CONVERSATION_KEY); } catch { return null; }
}

export function saveConversationId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.localStorage.setItem(VOICE_CONVERSATION_KEY, id);
    else window.localStorage.removeItem(VOICE_CONVERSATION_KEY);
  } catch { /* storage unavailable */ }
}