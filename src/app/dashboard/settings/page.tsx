'use client';

import { useState, useEffect } from 'react';
import { Monitor, Palette, User as UserIcon, LogOut, KeyRound, Trash2, Volume2, BellRing, Moon } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Field, Spinner } from '@/components/platform/ui';
import { useSession } from '@/components/platform/SessionProvider';
import { loadAudioPrefs, saveAudioPrefs, playTing, DEFAULT_AUDIO_PREFS, type AudioPrefs } from '@/lib/ting';

const roleTone = (r: string) => (r === 'owner' || r === 'admin' ? 'red' : r === 'manager' ? 'amber' : r === 'member' ? 'blue' : 'gray') as 'red' | 'amber' | 'blue' | 'gray';

interface ProvStatus { kind: string; provider: string; usesBaseline: boolean; keyConfigured: boolean; model: string; }

export default function SettingsPage() {
  const { me, logout } = useSession();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [accent, setAccent] = useState('#8b5cf6');

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

  const saveAppearance = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/appearance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'dark', accent, layoutDensity: 'comfortable' }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
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
        <CardHeader title="Appearance" sub="Persisted via the appearance API" />
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300">Theme</span>
            <Badge tone="purple">dark</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300">Accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
            <span className="text-xs text-gray-500 font-mono">{accent}</span>
          </div>
          <div className="flex justify-end">
            <Btn onClick={saveAppearance} disabled={busy}>{busy ? <Spinner /> : 'Save appearance'}</Btn>
            {saved && <span className="ml-3 self-center text-xs text-emerald-400">Saved.</span>}
          </div>
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
          <p className="text-[10px] text-gray-600">
            Saved to this browser. The amber visual alert stays visible even when the sound is muted.
            Browsers require a first interaction before any sound can play — that is enforced here too.
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