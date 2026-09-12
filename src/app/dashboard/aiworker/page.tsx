'use client';

import { useState } from 'react';
import { Bookmark, Bot, Clock, Sparkles, SquareTerminal } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Select, Field, Textarea, Empty, Spinner, Modal, fmtDateTime } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Generation { id: string; kind: string; prompt: string; result?: string; provider: string; saved: boolean; createdAt: string; }
interface Execution { id: string; workflowId: string; trigger: string; status: string; startedAt: string; results: Array<{ action?: string; output?: string; error?: string }>; verified?: boolean; }

const GEN_KINDS = ['content', 'code', 'image', 'voice', 'transcription', 'speech', 'video'];
const KIND_COLOR: Record<string, string> = { content: '#9B6CFF', code: '#438BFF', image: '#00D9B2', voice: '#FF9D21', transcription: '#FF4D61', speech: '#9B6CFF', video: '#438BFF' };

export default function AIWorkerPage() {
  const generations = useCollection<Generation>('generations', {});
  const executions = useCollection<Execution>('executions', {});
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('content');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);

  const running = executions.rows.filter((e) => ['queued', 'running', 'waiting'].includes(e.status)).length;
  const savedCount = generations.rows.filter((g) => g.saved).length;

  const run = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      await collection.create('generations', { kind, prompt: prompt.trim() });
      setPrompt(''); setKind('content');
      setOpen(false);
      generations.reload(); executions.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSave = async (g: Generation) => {
    try {
      await collection.update('generations', g.id, { op: 'save' });
      generations.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">AI Worker</h1>
          <p className="mt-0.5 text-xs text-gray-500">AI task engine — connect AI services, automate tasks. Runs every generation through the configured provider.</p>
        </div>
        <Btn kind="solid" onClick={() => setOpen(true)}><Sparkles className="h-4 w-4" /> Dispense a job</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Jobs dispensed</p><p className="mt-1.5 text-2xl font-bold text-white">{generations.rows.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Active executions</p><p className="mt-1.5 text-2xl font-bold text-[#9B6CFF]">{running}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Provision outcomes</p><p className="mt-1.5 text-2xl font-bold text-[#00D9B2]">{executions.rows.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Saved to memory</p><p className="mt-1.5 text-2xl font-bold text-amber-400">{savedCount}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Generation feed" right={<Badge tone="purple">{generations.rows.length}</Badge>} />
          {generations.loading ? (
            <Spinner />
          ) : generations.rows.length === 0 ? (
            <Empty title="No jobs yet" hint="Dispense a content job, a code draft, or any other kind — the worker runs it through the provider engine and logs it here." />
          ) : (
            <div className="divide-y divide-white/5">
              {generations.rows.slice(0, 15).map((g) => (
                <div key={g.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="gray" ><span className="mr-1" style={{ color: KIND_COLOR[g.kind] ?? '#888' }}>◆</span>{g.kind}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">via {g.provider}</span>
                      <button
                        type="button"
                        onClick={() => toggleSave(g)}
                        title={g.saved ? 'Remove from memory' : 'Save to memory'}
                        className="text-gray-600 hover:text-amber-400"
                      >
                        <Bookmark className="h-3.5 w-3.5" style={g.saved ? { color: '#fbbf24', fill: '#fbbf24' } : undefined} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-gray-100">{g.prompt}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{g.result?.slice(0, 320)}</p>
                  <p className="mt-1 text-[10px] text-gray-600">{fmtDateTime(g.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Executions & outcomes" right={<Badge tone="blue">{executions.rows.length}</Badge>} />
          {executions.loading ? (
            <Spinner />
          ) : executions.rows.length === 0 ? (
            <Empty title="No executions yet" hint="Workflow runs appear here as automation and AI Worker try them. They are real records from the automation engine." />
          ) : (
            <div className="divide-y divide-white/5">
              {executions.rows.slice(0, 15).map((e) => (
                <div key={e.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-mono text-[10px] text-gray-400">{e.workflowId.slice(0, 12)} …</p>
                    <Badge
                      tone={e.status === 'completed' ? 'green' : e.status === 'failed' ? 'red' : e.status === 'queued' || e.status === 'waiting' ? 'amber' : 'blue'}
                    >
                      {e.status}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3 w-3 text-gray-600" /> {fmtDateTime(e.startedAt)}
                    <span className="text-gray-600">·</span> trigger {e.trigger}
                    <SquareTerminal className="h-3 w-3 text-gray-600" />
                    <span className="text-gray-300">{e.results?.length ?? 0} steps</span>
                    {e.verified && <Badge tone="green">verified</Badge>}
                  </p>
                  {e.results?.[e.results.length - 1]?.error && (
                    <p className="mt-1 text-[11px] text-rose-400">{e.results[e.results.length - 1].error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Dispense a job to the AI Worker">
        <div className="space-y-3">
          <Field label="Kind">
            <Select value={kind} onChange={setKind} options={GEN_KINDS.map((k) => ({ label: k, value: k }))} />
          </Field>
          <Field label="Prompt">
            <Textarea value={prompt} onChange={setPrompt} rows={3} placeholder="Describe what the worker should produce…" />
          </Field>
          <Btn kind="solid" disabled={busy || !prompt.trim()} onClick={run} className="w-full">
            <Bot className="h-4 w-4" /> {busy ? 'Working…' : 'Run job'}
          </Btn>
          <p className="text-center text-[10px] text-gray-600">
            Runs through the workspace AI provider (baseline fallback included). Results land in the generation feed and Memory.
          </p>
        </div>
      </Modal>
    </div>
  );
}