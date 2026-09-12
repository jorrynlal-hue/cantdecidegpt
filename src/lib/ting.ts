// Shared attention "ting — ting — ting" sound + audio preferences.
// Best-effort: browsers require a user interaction before audio can play, so
// the alerts gate on that; everything here is defensive.

export interface AudioPrefs {
  enabled: boolean;
  volume: number; // 0..100
  quietEnabled: boolean;
  quietFrom: string; // "HH:MM"
  quietTo: string; // "HH:MM"
  browserNotify: boolean;
  voiceEnabled: boolean;
  wakeWord: string;
}

export const AUDIO_PREFS_KEY = 'cdg.audio-prefs';
export const DEFAULT_WAKE_WORD = 'hey nexus';

export const DEFAULT_AUDIO_PREFS: AudioPrefs = {
  enabled: true,
  volume: 60,
  quietEnabled: false,
  quietFrom: '22:00',
  quietTo: '08:00',
  browserNotify: false,
  voiceEnabled: false,
  wakeWord: DEFAULT_WAKE_WORD,
};

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

// Soft three-tone "ting — ting — ting" (D6, G6, B6), sine wave with a quick
// attack and decay. Count defaults to 3 per the design.
export function playTing(opts?: { volume?: number; count?: number }): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const vol = Math.max(0, Math.min(1, (opts?.volume ?? 60) / 100));
    const count = Math.max(1, Math.min(6, opts?.count ?? 3));
    const freqs = [1174.66, 1567.98, 1975.53];
    for (let i = 0; i < count; i++) {
      const t = ctx.currentTime + i * 0.22;
      const freq = freqs[i % freqs.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    }
  } catch {
    /* sound is best-effort until the browser allows audio */
  }
}

export function loadAudioPrefs(): AudioPrefs {
  const base = { ...DEFAULT_AUDIO_PREFS };
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(AUDIO_PREFS_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<AudioPrefs>;
      return {
        enabled: typeof d.enabled === 'boolean' ? d.enabled : base.enabled,
        volume: typeof d.volume === 'number' ? Math.max(0, Math.min(100, d.volume)) : base.volume,
        quietEnabled: typeof d.quietEnabled === 'boolean' ? d.quietEnabled : base.quietEnabled,
        quietFrom: typeof d.quietFrom === 'string' ? d.quietFrom : base.quietFrom,
        quietTo: typeof d.quietTo === 'string' ? d.quietTo : base.quietTo,
        browserNotify: typeof d.browserNotify === 'boolean' ? d.browserNotify : base.browserNotify,
        voiceEnabled: typeof d.voiceEnabled === 'boolean' ? d.voiceEnabled : base.voiceEnabled,
        wakeWord: typeof d.wakeWord === 'string' && d.wakeWord.trim() ? d.wakeWord.slice(0, 40) : base.wakeWord,
      };
    }
  } catch { /* defaults */ }
  return base;
}

export function saveAudioPrefs(p: AudioPrefs): void {
  try {
    window.localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(p));
  } catch { /* storage may be unavailable */ }
}

function minutesOf(hm: string): number {
  const [h, m] = hm.split(':').map((x) => Number(x) || 0);
  return h * 60 + m;
}

export function inQuietHours(p: AudioPrefs, now = new Date()): boolean {
  if (!p.quietEnabled) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const from = minutesOf(p.quietFrom);
  const to = minutesOf(p.quietTo);
  if (from === to) return false;
  return from < to ? nowMin >= from && nowMin < to : nowMin >= from || nowMin < to;
}

export function prefersReducedAudio(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mq ? mq.matches : false;
  } catch { return false; }
}