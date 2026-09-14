'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, User as UserIcon, LogOut, KeyRound, Trash2, Volume2, BellRing, Moon, Mic, Rocket, RotateCcw, Sparkles } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Field, Spinner } from '@/components/platform/ui';
import { useSession } from '@/components/platform/SessionProvider';
import { useCollection } from '@/components/platform/data';
import { plans } from '@/lib/core/client';
import { useTheme, THEME_PRESETS, getBrand, setBrand } from '@/lib/theme';
import { loadAudioPrefs, saveAudioPrefs, playTing, DEFAULT_AUDIO_PREFS, DEFAULT_WAKE_WORD, type AudioPrefs } from '@/lib/ting';
import { speak } from '@/lib/voice';

interface Project { id: string; name: string; status: string; }

const PLAN_LIMITS: Record<string, number> = { essential: 3, pro: 5 };
const DEFAULT_BRAND = "CAN'T DECIDE GPT";

const roleTone = (r: string) => (r === 'owner' || r === 'admin' ? 'red' : r === 'manager' ? 'amber' : r === 'member' ? 'blue' : 'gray') as 'red' | 'amber' | 'blue' | 'gray';

interface ProvStatus { kind: string; provider: string; usesBaseline: boolean; keyConfigured: boolean; model: string; }

export default function SettingsPage() {
  const { me, logout } = useSession();
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { theme, preset, setTheme, reset } = useTheme();
  const [brand, setBrandState] = useState<string>(() => (typeof window === 'undefined' ? DEFAULT_BRAND : getBrand()));
  const projects = useCollection<Project>('projects', {});
  const [activePlan, setActivePlan] = useState('pro');

  const [st, setSt] = useState<{ hasKey: boolean; maskedKey: string; baseUrl: string; model: string; kinds: ProvStatus[] } | null>(null);
  const [key, setKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const [audio, setAudio] = useState<AudioPrefs>(() => (typeof window === 'undefined' ? DEFAULT_AUDIO_PREFS : loadAudioPrefs()));
  const [notifState, setNotifState] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported');

  const setPref = (p: Partial<AudioPrefs>) => {
    setAudio((prev) => {
      const next = { ...prev, ...p };
      saveAudioPrefs(next);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cdg-audio-prefs'));
      return next;
    });
  };

  const testSound = () => playTing({ volume: audio.volume });

  const testVoice = () => {
    speak('This is your Nexus voice. Say the wake word, then a command like, open tasks.', { volume: audio.volume, force: true });
  };

  const askBrowser = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotifState(perm);
      setPref({ browserNotify: perm === 'granted' });
    } catch { /* denied or blocked */ }
  };

  useEffect(() => {
    fetch('/api/providers').then((r) => r.json()).then((d) => {
      if (d.ok) { setSt(d.data); setBaseUrl(d.data.baseUrl ?? ''); setModel(d.data.model ?? ''); }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    plans.list().then((r) => setActivePlan(r.active)).catch(() => {});
  }, []);

  const saveAI = async () => {
    setAiBusy(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key || undefined, baseUrl: baseUrl || undefined, model: model || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? 'Save failed');
      setSt(d.data);
      setKey('');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setAiBusy(false);
    }
  };

  const clearAI = async () => {
    if (!confirm('Remove the stored AI provider key?')) return;
    setAiBusy(true);
    try {
      const res = await fetch('/api/providers', { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? 'Clear failed');
      setSt(d.data);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setAiBusy(false);
    }
  };

  const saveBrand = () => {
    const name = brand.trim() || DEFAULT_BRAND;
    setBrand(name);
    setBrandState(name);
    document.title = name;
    try {
      localStorage.setItem('cdg.brand.set', '1');
    } catch { /* ignore */ }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-bold">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Your profile and workspace preference.</p>
      </div>

      <Card>
        <CardHeader title="Profile" sub="Your session identity (managed by the auth API)" />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{me?.user?.name ?? '—'}</p>
              <p className="text-xs text-gray-500">{me?.user?.email ?? '—'}</p>
            </div>
            <Badge tone={roleTone(me?.user?.role ?? 'member')}>{me?.user?.role}</Badge>
          </div>
          <Field label="Active workspace"><Input value={me?.workspaces?.find((w: { id: string }) => w.id === me.activeWorkspaceId)?.name ?? ''} onChange={() => {}} readOnly /></Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Appearance" sub="Site-colour theme — applied live and saved to this browser." />
        <div className="p-4 space-y-5">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[var(--c-accent)]" />
            <span className="text-sm font-semibold text-[var(--text-main)]">Presets</span>
            <Badge tone="purple">{preset?.name ?? 'Custom'}</Badge>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {THEME_PRESETS.map((p) => {
              const on = theme.presetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setTheme({ presetId: p.id, accent: p.accent, strong: p.strong })}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${on ? 'border-[var(--c-accent)]/60 bg-white/[0.04]' : 'border-white/10 hover:border-white/25'}`}
                  aria-label={`Set theme ${p.name}`}
                >
                  <span
                    className="h-7 w-7 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.strong})`, boxShadow: on ? `0 0 12px ${p.accent}66` : 'none' }}
                  />
                  <span className="text-[9px] font-semibold text-[var(--text-soft)]">{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Custom colour</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
                Accent
                <input
                  type="color"
                  value={theme.presetId === 'custom' ? theme.accent : (preset?.accent ?? theme.accent)}
                  onChange={(e) => setTheme({ presetId: 'custom', accent: e.target.value })}
                  className="h-7 w-9 cursor-pointer rounded bg-transparent"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
                Strong
                <input
                  type="color"
                  value={theme.strong}
                  onChange={(e) => setTheme({ presetId: 'custom', strong: e.target.value })}
                  className="h-7 w-9 cursor-pointer rounded bg-transparent"
                />
              </label>
              <button
                onClick={() => setTheme({ presetId: 'custom' })}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${theme.presetId === 'custom' ? 'text-[#0B1020]' : 'text-[var(--text-soft)]'}`}
                style={theme.presetId === 'custom' ? { background: 'var(--c-accent)' } : { background: 'rgba(255,255,255,0.05)' }}
              >
                Use custom
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Glass opacity', key: 'glass' as const, min: 20, max: 100, unit: '%' },
              { label: 'Blur', key: 'blur' as const, min: 0, max: 24, unit: 'px' },
              { label: 'Accent glow', key: 'glow' as const, min: 0, max: 100, unit: '%' },
              { label: 'Text brightness', key: 'textBrightness' as const, min: 20, max: 100, unit: '%' },
            ].map((s) => (
              <label key={s.key} className="flex flex-col gap-1.5">
                <span className="text-[11px] text-[var(--muted)]">
                  {s.label} — <span className="font-mono">{theme[s.key]}{s.unit}</span>
                </span>
                <input
                  type="range" min={s.min} max={s.max} value={theme[s.key]}
                  onChange={(e) => setTheme({ [s.key]: Number(e.target.value) })}
                  className="h-1.5 cursor-pointer"
                  style={{ accentColor: 'var(--c-accent)' }}
                />
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-soft)]">Animations</span>
            <button
              onClick={() => setTheme({ animation: !theme.animation })}
              className={`relative ml-auto h-6 w-11 rounded-full transition-colors ${theme.animation ? 'bg-[var(--c-accent)]/70' : 'bg-white/10'}`}
              aria-label="Toggle animations"
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${theme.animation ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <Badge tone={theme.animation ? 'green' : 'gray'}>{theme.animation ? 'on' : 'off'}</Badge>
            <Btn small kind="outline" onClick={reset}><RotateCcw className="w-3 h-3" /> Reset</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Brand" sub="Shown in the sidebar, header, login and the document title." />
        <div className="p-4 space-y-3">
          <Field label="Brand name">
            <Input value={brand} onChange={(v) => setBrandState(v)} placeholder={DEFAULT_BRAND} />
          </Field>
          <div className="flex items-center gap-2">
            <Btn onClick={saveBrand}><Sparkles className="w-3.5 h-3.5" /> Save brand</Btn>
            <span className="text-[10px] text-gray-600">This is the identity of your operating system — everything in it runs under this name.</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Your plan" sub="How many projects your workspace can carry on this plan." />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[var(--c-accent)]" />
            <span className="text-sm font-semibold text-[var(--text-main)] capitalize">{activePlan} workspace</span>
            <Badge tone={activePlan === 'essential' ? 'amber' : 'purple'}>
              {activePlan === 'essential' ? 'essential · 3 projects' : 'pro · 5 projects'}
            </Badge>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (projects.rows.length / (PLAN_LIMITS[activePlan] ?? 5)) * 100)}%`, background: 'var(--c-accent)' }}
              />
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              {projects.rows.length} of {PLAN_LIMITS[activePlan] ?? 5} projects used. Exceeding the limit blocks new projects.
            </p>
          </div>
          <Btn small kind="outline" onClick={() => router.push('/dashboard/plans')}>See plans &amp; billing</Btn>
        </div>
      </Card>

      <Card>
        <CardHeader title="Audio and notifications" sub="Controls the attendance &quot;ting · ting · ting&quot; alert. Sound only plays after you interact with the page, and never inside quiet hours." />
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300">Attention sound</span>
            <button
              onClick={() => setPref({ enabled: !audio.enabled })}
              className={`relative ml-auto h-6 w-11 rounded-full transition-colors ${audio.enabled ? 'bg-emerald-500/70' : 'bg-white/10'}`}
              aria-label="Toggle attention sound"
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${audio.enabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <Badge tone={audio.enabled ? 'green' : 'gray'}>{audio.enabled ? 'on' : 'muted'}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-400">Volume</span>
            <input
              type="range" min={0} max={100} value={audio.volume}
              onChange={(e) => setPref({ volume: Number(e.target.value) })}
              className="h-1.5 w-48 cursor-pointer accent-emerald-400"
            />
            <span className="w-10 text-xs text-gray-400 font-mono">{audio.volume}%</span>
            <Btn small onClick={testSound}>Test sound</Btn>
          </div>

          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300">Quiet hours</span>
            <button
              onClick={() => setPref({ quietEnabled: !audio.quietEnabled })}
              className={`relative ml-auto h-6 w-11 rounded-full transition-colors ${audio.quietEnabled ? 'bg-purple-500/70' : 'bg-white/10'}`}
              aria-label="Toggle quiet hours"
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${audio.quietEnabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <Badge tone={audio.quietEnabled ? 'purple' : 'gray'}>{audio.quietEnabled ? 'on' : 'off'}</Badge>
          </div>
          {audio.quietEnabled && (
            <div className="flex items-center gap-3 pl-7">
              <Field label="From"><Input type="time" value={audio.quietFrom} onChange={(v) => setPref({ quietFrom: v })} /></Field>
              <Field label="To"><Input type="time" value={audio.quietTo} onChange={(v) => setPref({ quietTo: v })} /></Field>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-300">Browser notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={notifState === 'granted' ? 'green' : notifState === 'denied' ? 'red' : 'gray'}>
                {notifState === 'granted' ? 'granted' : notifState === 'denied' ? 'blocked' : notifState === 'default' ? 'not asked' : 'unsupported'}
              </Badge>
              <Btn small onClick={askBrowser} disabled={notifState === 'denied' || notifState === 'unsupported'}>Enable</Btn>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#FF5A91]" />
            <span className="text-sm text-gray-300">Voice assistant</span>
            <button
              onClick={() => setPref({ voiceEnabled: !audio.voiceEnabled })}
              className={`relative ml-auto h-6 w-11 rounded-full transition-colors ${audio.voiceEnabled ? 'bg-[#FF5A91]/70' : 'bg-white/10'}`}
              aria-label="Toggle voice assistant"
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${audio.voiceEnabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <Badge tone={audio.voiceEnabled ? 'purple' : 'gray'}>{audio.voiceEnabled ? 'on' : 'off'}</Badge>
          </div>
          {audio.voiceEnabled && (
            <div className="pl-7 space-y-3">
              <Field label="Wake word">
                <Input value={audio.wakeWord} onChange={(v) => setPref({ wakeWord: v })} placeholder={DEFAULT_WAKE_WORD} />
              </Field>
              <div className="flex items-center gap-2">
                <Btn small onClick={testVoice}>Test voice</Btn>
                <span className="text-[10px] text-gray-500">Replies are spoken with the system browser voice.</span>
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-600">
            Hands-free on this browser: say the wake word, then a command like &quot;open tasks&quot; or &quot;create a task&quot;.
            Commands route to the assistant and reply by voice. Needs Chrome/Edge. Toggle with Ctrl+Shift+V.
          </p>
          <p className="text-[10px] text-gray-600">
            Saved to this browser. The amber visual alert stays visible even when the sound is muted.
            Sound only plays after you interact with the page and never inside quiet hours.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="AI provider" sub="Real generation when a key is set; otherwise the honest baseline simulator is used." />
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300">Engine</span>
            {st?.hasKey ? <Badge tone="green">live ({st.maskedKey})</Badge> : <Badge tone="gray">baseline simulator</Badge>}
            {st?.baseUrl ? <span className="text-[10px] text-gray-600">{st.baseUrl}</span> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {st?.kinds.map((k) => (
              <div key={k.kind} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <span className="text-xs text-gray-300 capitalize">{k.kind}</span>
                <Badge tone={!k.usesBaseline ? 'green' : 'gray'}>{!k.usesBaseline ? `${k.provider} · live` : 'baseline'}</Badge>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Field label="OpenAI-compatible API key (stored server-side, never shown again)">
              <Input type="password" value={key} onChange={(v) => setKey(v)} placeholder={st?.hasKey ? '•••••••• (existing key — leave blank to keep)' : 'sk-...'} />
            </Field>
            <Field label="Base URL">
              <Input value={baseUrl} onChange={(v) => setBaseUrl(v)} placeholder="https://api.openai.com/v1" />
            </Field>
            <Field label="Model">
              <Input value={model} onChange={(v) => setModel(v)} placeholder="gpt-4o-mini (or per-kind defaults)" />
            </Field>
            <div className="flex items-center gap-2">
              <Btn onClick={saveAI} disabled={aiBusy}>{aiBusy ? <Spinner /> : 'Save AI provider'}</Btn>
              {st?.hasKey ? (
                <Btn kind="danger" small onClick={clearAI} disabled={aiBusy}><Trash2 className="w-3 h-3" /> Remove key</Btn>
              ) : null}
            </div>
            <p className="text-[10px] text-gray-600">Works with api.openai.com or any OpenAI-compatible gateway. Keys are validated, stored in the ignored <span className="font-mono">.data/</span> folder, and never returned to the browser.</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Session" />
        <div className="p-4">
          <Btn kind="danger" onClick={async () => { setBusy(true); try { await logout(); } finally { setBusy(false); } }} disabled={busy}>
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </Btn>
        </div>
      </Card>
    </div>
  );
}