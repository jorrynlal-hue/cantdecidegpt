'use client';

import { useState, useEffect } from 'react';
import { Unplug, Plug, Save } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Empty, Spinner } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';

interface Integration { id: string; name: string; category: string; status: string; services: string[]; note?: string; }
interface ProviderConfig { id: string; kind: string; provider: string; enabled: boolean; settings: Record<string, unknown>; }
interface ProvStatus { kind: string; provider: string; usesBaseline: boolean; keyConfigured: boolean; model: string; }

const KINDS = ['chat', 'content', 'image', 'video', 'voice', 'transcription', 'speech', 'code'];
const PROVIDERS = ['baseline', 'openai', 'anthropic', 'gemini', 'mistral', 'runway', 'midjourney', 'elevenlabs', 'resemblyzer'];

export default function IntegrationsPage() {
  const integrations = useCollection<Integration>('integrations', {});
  const providerConfigs = useCollection<ProviderConfig>('providerConfigs', {});
  const [busy, setBusy] = useState<string | null>(null);
  const [token, setToken] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [provStatus, setProvStatus] = useState<ProvStatus[]>([]);

  useEffect(() => {
    fetch('/api/providers')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setProvStatus(d.data.kinds ?? []); })
      .catch(() => {});
  }, []);

  const connect = async (id: string, name: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/integrations/${id}/connect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token[id] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? 'Connect failed');
      setNote((n) => ({ ...n, [id]: d?.note ?? d?.connected ? 'Connected.' : 'Status updated.' }));
      integrations.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (id: string) => {
    if (!confirm('Disconnect this integration?')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/integrations/${id}/disconnect`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? 'Disconnect failed');
      }
      integrations.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveProvider = async (cfg: ProviderConfig, provider: string, enabled: boolean) => {
    try {
      await fetch(`/api/db/providerConfigs/${cfg.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: cfg.kind, provider, enabled }),
      });
      providerConfigs.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Integrations</h1>
        <p className="text-xs text-gray-500 mt-0.5">Connect channels and pick AI providers. Channel handshakes are honest simulations (no external side effects); connecting stores a token for this workspace. AI providers go live when an API key is configured in Settings → AI provider.</p>
      </div>

      <Card>
        <CardHeader title="Channels & services" sub="Route emails, social posts, uploads and AI through these" />
        {integrations.loading ? <Spinner /> : integrations.rows.length === 0 ? (
          <Empty title="No integrations available" hint="Seeded stubs will appear here." />
        ) : (
          <div className="divide-y divide-white/5">
            {integrations.rows.map((i) => (
              <div key={i.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{i.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{i.category} · {i.services.join(', ')}</p>
                    {i.note ? <p className="text-[10px] text-gray-600 mt-0.5">{i.note}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={i.status === 'connected' ? 'green' : 'gray'}>{i.status}</Badge>
                    {i.status === 'connected' ? (
                      <Btn kind="danger" small onClick={() => disconnect(i.id)} disabled={busy === i.id}>
                        <Unplug className="w-3 h-3" /> Disconnect
                      </Btn>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Input value={token[i.id] ?? ''} onChange={(v) => setToken((t) => ({ ...t, [i.id]: v }))} placeholder="token (optional)" className="w-32 !py-1" />
                        <Btn kind="solid" small onClick={() => connect(i.id, i.name)} disabled={busy === i.id}>
                          <Plug className="w-3 h-3" /> Connect
                        </Btn>
                      </div>
                    )}
                    {note[i.id] ? <span className="text-[10px] text-purple-300">{note[i.id]}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="AI providers" sub="Which provider each generation kind uses. Baseline = honest deterministic simulator until a live API key is configured (Settings → AI provider)." />
        {providerConfigs.loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/5"><tr>
                <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Kind</th>
                <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Provider</th>
                <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Enabled</th>
                <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-gray-500">Engine</th>
                <th className="px-4 py-2"></th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {KINDS.map((kind) => {
                  const cfg = providerConfigs.rows.find((c) => c.kind === kind);
                  const st = provStatus.find((s) => s.kind === kind);
                  if (!cfg) return null;
                  return (
                    <tr key={kind} className="hover:bg-white/5">
                      <td className="px-4 py-2 text-sm text-white capitalize">{kind}</td>
                      <td className="px-4 py-2">
                        <Select
                          value={cfg.provider}
                          onChange={(v) => saveProvider(cfg, v, cfg.enabled)}
                          options={PROVIDERS.map((p) => ({ label: p, value: p }))}
                          className="!w-56"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => saveProvider(cfg, cfg.provider, !cfg.enabled)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${cfg.enabled ? 'bg-purple-500' : 'bg-white/10'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${cfg.enabled ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        {st && !st.usesBaseline ? (
                          <Badge tone="green">{st.provider} · live</Badge>
                        ) : (
                          <Badge tone="gray">baseline</Badge>
                        )}
                        {st?.model ? <span className="ml-2 text-[10px] text-gray-600">{st.model}</span> : null}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Btn kind="ghost" small onClick={() => saveProvider(cfg, cfg.provider, cfg.enabled)}><Save className="w-3 h-3" /> Keep</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}