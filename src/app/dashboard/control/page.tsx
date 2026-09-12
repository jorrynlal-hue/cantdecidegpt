'use client';

import { useState } from 'react';
import { Plus, Trash2, ShieldCheck, KeyRound, Boxes, Cpu, Globe2, Plug, RefreshCw, Minus, Layers } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Empty, Spinner, Modal, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection, integrations } from '@/lib/core/client';

type Tab = 'models' | 'connectors' | 'vault' | 'registry';

const kindLabel = (k?: string) =>
  ({ api: 'API', oauth: 'OAuth', mcp: 'MCP', webhook: 'Webhook', browser: 'Browser' })[k ?? 'api'] ?? 'Connector';

const riskTone = (r: string) => (r === 'high' ? 'red' : r === 'medium' ? 'amber' : 'green') as 'red' | 'amber' | 'green';
const healthTone = (h?: string) => (h === 'ok' ? 'green' : h === 'down' ? 'red' : h === 'degraded' ? 'amber' : 'gray') as 'green' | 'red' | 'amber' | 'gray';

export default function ControlCenterPage() {
  const [tab, setTab] = useState<Tab>('models');
  const models = useCollection<{ id: string; kind: string; provider: string; enabled: boolean; settings: Record<string, unknown> }>('providerConfigs', {});
  const conns = useCollection<{ id: string; name: string; category: string; kind?: string; provider?: string; domain?: string; endpoint?: string; connected: boolean; status: string; health?: string; permissions: string[]; updatedAt: string; error?: string }>('integrations', {});
  const creds = useCollection<{ id: string; name: string; kind: string; provider: string; masked: string; scopes: string[]; agentIds: string[]; status: string; expiresAt?: string }>('credentials', {});
  const tools = useCollection<{ id: string; name: string; description: string; capability: string; risk: string; cost: string; availability: string; owner?: string; permission?: string; auth?: string; agentAccess: boolean; humanAccess: boolean; usageCount: number; inputs: string[] }>('tools', {});

  const [modelBusy, setModelBusy] = useState(false);
  const [connOpen, setConnOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);

  const [connForm, setConnForm] = useState({ name: '', kind: 'api', provider: '', domain: '', endpoint: '', scopes: '' });
  const [vaultForm, setVaultForm] = useState({ name: '', kind: 'apikey', provider: '', secret: '', scopes: '', agentIds: '', expiresAt: '' });
  const [toolForm, setToolForm] = useState({ name: '', description: '', capability: '', risk: 'low', cost: '$0', availability: 'all', auth: 'session', inputs: '' });

  const saveModel = async (id: string, kind: string, patch: { provider?: string; enabled?: boolean }) => {
    setModelBusy(true);
    try {
      await collection.update('providerConfigs', id, { kind, ...patch });
      models.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setModelBusy(false);
    }
  };

  const testConn = async (id: string) => {
    try {
      await integrations.test(id);
      conns.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const connect = async (id: string, on: boolean) => {
    try {
      if (on) await integrations.connect(id);
      else await integrations.disconnect(id);
      conns.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const addConn = async () => {
    if (!connForm.name.trim()) return;
    try {
      await collection.create('integrations', {
        name: connForm.name.trim(),
        kind: connForm.kind,
        provider: connForm.provider || undefined,
        domain: connForm.domain || undefined,
        endpoint: connForm.endpoint || undefined,
        scopes: connForm.scopes.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setConnOpen(false);
      setConnForm({ name: '', kind: 'api', provider: '', domain: '', endpoint: '', scopes: '' });
      conns.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const addCred = async () => {
    if (!vaultForm.name.trim()) return;
    try {
      await collection.create('credentials', {
        name: vaultForm.name.trim(),
        kind: vaultForm.kind,
        provider: vaultForm.provider || undefined,
        secret: vaultForm.secret || undefined,
        scopes: vaultForm.scopes.split(',').map((s) => s.trim()).filter(Boolean),
        agentIds: vaultForm.agentIds.split(',').map((s) => s.trim()).filter(Boolean),
        expiresAt: vaultForm.expiresAt || undefined,
      });
      setVaultOpen(false);
      setVaultForm({ name: '', kind: 'apikey', provider: '', secret: '', scopes: '', agentIds: '', expiresAt: '' });
      creds.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const addTool = async () => {
    if (!toolForm.name.trim()) return;
    try {
      await collection.create('tools', {
        name: toolForm.name.trim(),
        description: toolForm.description,
        capability: toolForm.capability,
        risk: toolForm.risk,
        cost: toolForm.cost,
        availability: toolForm.availability,
        auth: toolForm.auth,
        inputs: toolForm.inputs.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setToolOpen(false);
      setToolForm({ name: '', description: '', capability: '', risk: 'low', cost: '$0', availability: 'all', auth: 'session', inputs: '' });
      tools.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const toggleTool = async (id: string, field: 'agentAccess' | 'humanAccess') => {
    try {
      const t = tools.rows.find((x) => x.id === id);
      if (!t) return;
      await collection.update('tools', id, { [field]: !t[field] });
      tools.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const marquee = [
    { icon: <Cpu className="h-4 w-4 text-purple-400" />, k: 'AI models', v: String(models.rows.length) },
    { icon: <Plug className="h-4 w-4 text-emerald-400" />, k: 'Connections', v: String(conns.rows.length) },
    { icon: <Globe2 className="h-4 w-4 text-sky-400" />, k: 'Browser workers', v: String(conns.rows.filter((c) => c.kind === 'browser').length) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Control Center</h1>
          <p className="text-xs text-gray-500 mt-0.5">Universal access: AI models, apps, websites, browsers, APIs, MCP, the credential vault and the tool registry.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {marquee.map((m) => (
            <Card key={m.k} className="p-3">
              <div className="flex items-center gap-2">{m.icon}<p className="text-[10px] uppercase tracking-wider text-gray-500">{m.k}</p></div>
              <p className="mt-1 text-lg font-bold text-white">{m.v}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex rounded-lg border border-white/10 overflow-hidden w-fit">
        {(['models', 'connectors', 'vault', 'registry'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-xs font-medium capitalize ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'models' ? 'AI Models' : t === 'connectors' ? 'Apps, Web & APIs' : t === 'vault' ? 'Credential Vault' : 'Tool Registry'}
          </button>
        ))}
      </div>

      {tab === 'models' && (
        <Card>
          <CardHeader title="AI Models" sub="Every capability routes through a provider. Baseline = deterministic simulator; openai = live via env key." right={<Badge tone="purple">{models.rows.length} kinds</Badge>} />
          <div className="divide-y divide-white/5">
            {models.loading ? <Spinner /> : models.rows.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{m.kind}</p>
                  <p className="text-xs text-gray-500">{m.provider === 'baseline' ? 'baseline simulator — deterministic, honest, no API needed' : `${m.provider} — live model (env-configured)`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={m.provider}
                    onChange={(v) => saveModel(m.id, m.kind, { provider: v })}
                    options={[{ label: 'baseline (simulator)', value: 'baseline' }, { label: 'openai (live)', value: 'openai' }]}
                    className="w-44"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-gray-300">
                    <input type="checkbox" checked={m.enabled} disabled={modelBusy} onChange={(e) => saveModel(m.id, m.kind, { enabled: e.target.checked })} className="accent-purple-500" />
                    on
                  </label>
                </div>
                <Badge tone={m.enabled ? 'green' : 'gray'}>{m.enabled ? 'ready' : 'off'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'connectors' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Connectors appear as usable tools: API direct access, OAuth account access, MCP servers, webhooks and browser workers.</p>
            <Btn onClick={() => setConnOpen(true)}><Plus className="w-3.5 h-3.5" /> Add connector</Btn>
          </div>
          <Card>
            <CardHeader title="Connections" right={<Badge tone="green">{conns.rows.filter((c) => c.connected).length} connected</Badge>} />
            {conns.loading ? <Spinner /> : conns.rows.length === 0 ? (
              <Empty title="No connectors yet" hint="Add an API, OAuth, MCP server, webhook or browser worker." />
            ) : (
              <div className="divide-y divide-white/5">
                {conns.rows.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone="blue">{kindLabel(c.kind)}</Badge>
                        <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                        {c.status === 'connected' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                        {c.status === 'error' && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {[c.provider, c.endpoint, c.domain && `allowed: ${c.domain}`, c.permissions.length ? `${c.permissions.length} scopes` : null].filter(Boolean).join(' · ')}
                        {c.error ? ` · ${c.error}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={healthTone(c.health)}>{c.health ?? 'unknown'}</Badge>
                      <Btn kind="outline" small onClick={() => testConn(c.id)}><RefreshCw className="w-3 h-3" /> Test</Btn>
                      <Btn kind="ghost" small onClick={() => connect(c.id, !c.connected)}>{c.connected ? 'Disconnect' : 'Connect'}</Btn>
                      <button onClick={async () => { if (confirm(`Remove connector "${c.name}"?`)) { try { await collection.remove('integrations', c.id); conns.reload(); } catch (e) { alert((e as Error).message); } } }} className="p-1.5 rounded-md text-gray-600 hover:text-rose-400"><Minus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'vault' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Secrets are never stored or shown. The vault keeps masked hints and permissioned access per agent.</p>
            <Btn onClick={() => setVaultOpen(true)}><KeyRound className="w-3.5 h-3.5" /> Add credential</Btn>
          </div>
          <Card>
            <CardHeader title="Credential Vault" right={<Badge tone="purple">{creds.rows.length} entries</Badge>} />
            {creds.loading ? <Spinner /> : creds.rows.length === 0 ? (
              <Empty title="Vault is empty" hint="Add an API key, OAuth token, access token or browser session. Raw secrets stay out of the database." />
            ) : (
              <div className="divide-y divide-white/5">
                {creds.rows.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <p className="text-sm font-semibold text-white">{c.name}</p>
                        <Badge tone={c.status === 'active' ? 'green' : c.status === 'revoked' ? 'red' : 'amber'}>{c.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">{c.kind} · {c.provider} · key {c.masked}{c.agentIds.length ? ` · agents: ${c.agentIds.length}` : ' · all agents'}{c.expiresAt ? ` · expires ${fmtDate(c.expiresAt)}` : ''}</p>
                      {c.scopes.length ? <p className="text-[11px] text-gray-600">scopes: {c.scopes.join(', ')}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.status === 'active' ? (
                        <Btn kind="outline" small onClick={async () => { try { await collection.update('credentials', c.id, { status: 'revoked' }); creds.reload(); } catch (e) { alert((e as Error).message); } }}>Revoke</Btn>
                      ) : null}
                      <button onClick={async () => { if (confirm(`Delete credential "${c.name}"?`)) { try { await collection.remove('credentials', c.id); creds.reload(); } catch (e) { alert((e as Error).message); } } }} className="p-1.5 rounded-md text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'registry' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Every connected capability becomes a declared tool with inputs, permission, risk, cost and access boundaries.</p>
            <Btn onClick={() => setToolOpen(true)}><Layers className="w-3.5 h-3.5" /> Register tool</Btn>
          </div>
          <Card>
            <CardHeader title="Tool Registry" right={<Badge tone="purple">{tools.rows.length} tools</Badge>} />
            {tools.loading ? <Spinner /> : tools.rows.length === 0 ? (
              <Empty title="No tools registered" />
            ) : (
              <div className="divide-y divide-white/5">
                {tools.rows.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 max-w-xl">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{t.name}</p>
                        <Badge tone={riskTone(t.risk)}>{t.risk}</Badge>
                        <Badge tone="gray">{t.capability}</Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">{t.description}{t.inputs.length ? ` · inputs: ${t.inputs.join(', ')}` : ''}</p>
                      <p className="text-[11px] text-gray-600">{t.permission || 'no permission declared'} · auth {t.auth} · {t.cost}{t.owner ? ` · owner ${t.owner}` : ''} · {t.usageCount} uses</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <label className="flex items-center gap-1.5"><input type="checkbox" checked={t.agentAccess} onChange={() => toggleTool(t.id, 'agentAccess')} className="accent-purple-500" /> AI agents</label>
                      <label className="flex items-center gap-1.5"><input type="checkbox" checked={t.humanAccess} onChange={() => toggleTool(t.id, 'humanAccess')} className="accent-purple-500" /> Humans</label>
                      <Btn kind="outline" small onClick={async () => { try { await collection.remove('tools', t.id); tools.reload(); } catch (e) { alert((e as Error).message); } }}><Trash2 className="w-3 h-3" /></Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <Modal open={connOpen} onClose={() => setConnOpen(false)} title="Add universal connector" wide>
        <div className="space-y-3">
          <Field label="Name"><Input value={connForm.name} onChange={(v) => setConnForm({ ...connForm, name: v })} placeholder="Gmail, My CRM, Shopify API…" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={connForm.kind} onChange={(v) => setConnForm({ ...connForm, kind: v })} options={[{ label: 'API (direct access)', value: 'api' }, { label: 'OAuth (account access)', value: 'oauth' }, { label: 'MCP (AI tool server)', value: 'mcp' }, { label: 'Webhook (events)', value: 'webhook' }, { label: 'Website (browser worker)', value: 'browser' }]} />
            </Field>
            <Field label="Provider / platform name"><Input value={connForm.provider} onChange={(v) => setConnForm({ ...connForm, provider: v })} placeholder="Google, Notion…" /></Field>
          </div>
          {connForm.kind === 'browser' ? (
            <Field label="Allowed websites (comma separated)"><Input value={connForm.domain} onChange={(v) => setConnForm({ ...connForm, domain: v })} placeholder="https://app.shopify.com, https://admin.google.com" /></Field>
          ) : (
            <>
              <Field label="Endpoint / base URL"><Input value={connForm.endpoint} onChange={(v) => setConnForm({ ...connForm, endpoint: v })} placeholder="https://api.example.com/v1 or MCP server URL" /></Field>
              <Field label="Permissions (scopes, comma separated)"><Input value={connForm.scopes} onChange={(v) => setConnForm({ ...connForm, scopes: v })} placeholder="read, send, publish" /></Field>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setConnOpen(false)}>Cancel</Btn>
            <Btn onClick={addConn} disabled={!connForm.name.trim()}>Add connector</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={vaultOpen} onClose={() => setVaultOpen(false)} title="Add to Credential Vault" wide>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><Input value={vaultForm.name} onChange={(v) => setVaultForm({ ...vaultForm, name: v })} placeholder="Gmail API key" /></Field>
            <Field label="Kind">
              <Select value={vaultForm.kind} onChange={(v) => setVaultForm({ ...vaultForm, kind: v })} options={[{ label: 'API key', value: 'apikey' }, { label: 'OAuth token', value: 'oauth' }, { label: 'Access token', value: 'token' }, { label: 'Browser session', value: 'browser' }, { label: 'Service account', value: 'service' }]} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Provider"><Input value={vaultForm.provider} onChange={(v) => setVaultForm({ ...vaultForm, provider: v })} placeholder="Google, OpenAI…" /></Field>
            <Field label="Expires (YYYY-MM-DD, optional)"><Input value={vaultForm.expiresAt} onChange={(v) => setVaultForm({ ...vaultForm, expiresAt: v })} /></Field>
          </div>
          <Field label="Secret value (masked, never stored)"><Input type="password" value={vaultForm.secret} onChange={(v) => setVaultForm({ ...vaultForm, secret: v })} placeholder="••••••••••" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Scopes (comma separated)"><Input value={vaultForm.scopes} onChange={(v) => setVaultForm({ ...vaultForm, scopes: v })} placeholder="read, write" /></Field>
            <Field label="Agent IDs (empty = all agents)"><Input value={vaultForm.agentIds} onChange={(v) => setVaultForm({ ...vaultForm, agentIds: v })} placeholder="agent-sales, agent-marketing" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setVaultOpen(false)}>Cancel</Btn>
            <Btn onClick={addCred} disabled={!vaultForm.name.trim()}>Add credential</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={toolOpen} onClose={() => setToolOpen(false)} title="Register a tool" wide>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tool name"><Input value={toolForm.name} onChange={(v) => setToolForm({ ...toolForm, name: v })} placeholder="Send SMS" /></Field>
            <Field label="Capability"><Input value={toolForm.capability} onChange={(v) => setToolForm({ ...toolForm, capability: v })} placeholder="Communication" /></Field>
          </div>
          <Field label="Description"><Input value={toolForm.description} onChange={(v) => setToolForm({ ...toolForm, description: v })} placeholder="What does this tool do and when should it be used?" /></Field>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Risk"><Select value={toolForm.risk} onChange={(v) => setToolForm({ ...toolForm, risk: v })} options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }]} /></Field>
            <Field label="Cost"><Input value={toolForm.cost} onChange={(v) => setToolForm({ ...toolForm, cost: v })} placeholder="$0" /></Field>
            <Field label="Availability"><Select value={toolForm.availability} onChange={(v) => setToolForm({ ...toolForm, availability: v })} options={[{ label: 'All', value: 'all' }, { label: 'Approval', value: 'approval' }, { label: 'Roles', value: 'roles' }]} /></Field>
            <Field label="Auth"><Input value={toolForm.auth} onChange={(v) => setToolForm({ ...toolForm, auth: v })} placeholder="session" /></Field>
          </div>
          <Field label="Inputs (comma separated)"><Input value={toolForm.inputs} onChange={(v) => setToolForm({ ...toolForm, inputs: v })} placeholder="to, message" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setToolOpen(false)}>Cancel</Btn>
            <Btn onClick={addTool} disabled={!toolForm.name.trim()}><Boxes className="w-3.5 h-3.5" /> Register</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}