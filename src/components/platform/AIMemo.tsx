'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles, Copy, Check, Save, RefreshCw, Trash2, Lock, ShieldCheck, Wifi } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Textarea, Spinner } from '@/components/platform/ui';
import { ai, collection } from '@/lib/core/client';
import { OPERATOR_TOOL_MAP } from '@/lib/radial03';
import {
  useR3Store, r3signal, r3pushPow, r3SetPerm, effectivePerm, isHardGated,
  R3_STATUS_COLORS, R3_STATUS_LABELS, NEEDS_INTEGRATION, R3_PERM_LABELS, type R3Perm,
} from '@/lib/r3';

interface Outcome {
  output: string;
  provider: string;
  isBaseline: boolean;
  simulated: boolean;
}

interface AIMemoProps {
  toolId: string;
  title: string;
  sub?: string;
  icon?: ReactNode;
  placeholder?: string;
  examples?: string[];
  context?: string;
  kind?: string;
  prompt: (input: string, context?: string) => string;
  saveTitle?: (input: string) => string;
  saveLabel?: string;
  onSave?: (output: string, input: string) => Promise<void>;
}

export function AIMemo({
  toolId,
  title,
  sub,
  icon,
  placeholder = 'Describe what you need…',
  examples = [],
  context,
  kind = 'note',
  prompt,
  saveTitle,
  saveLabel = 'Save to memory',
  onSave,
}: AIMemoProps) {
  const r3 = useR3Store();
  const node = r3.nodes[toolId];
  const inR3 = OPERATOR_TOOL_MAP.has(toolId);
  const perm = effectivePerm(r3, toolId);
  const gated = isHardGated(toolId);
  const needConnection = inR3 && node?.status === 'not_connected' && NEEDS_INTEGRATION[toolId];
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const recordPow = (subject: string, provider: string, label: string, output: string) => {
    const mode = effectivePerm(r3, toolId);
    r3pushPow({
      id: `r3pow-${toolId}-${Date.now()}`,
      job: subject,
      summary: `${label} produced output for operator review.`,
      chain: [
        { name: 'JOB', detail: subject.slice(0, 140), source: 'Operator request', ok: true },
        { name: 'TOOLS', detail: `${title} (${toolId})`, source: 'Radial System 03', ok: true },
        { name: 'SOURCES', detail: provider, source: '/api/ai/generate', ok: true },
        { name: 'ACTIONS', detail: `Generated the ${label} response in the workspace.`, source: 'workspace run', ok: true },
        { name: 'DECISIONS', detail: 'Output produced and shown to the operator for review. Nothing was exported without permission.', source: "CAN'T DECIDE GPT specialist", ok: true },
        { name: 'APPROVALS', detail: `${mode} by the operator policy`, source: 'permission policy', ok: true },
        { name: 'RESULT', detail: output.slice(0, 220), source: 'output buffer', ok: true },
        { name: 'TIME', detail: new Date().toISOString(), source: 'system clock', ok: true },
      ],
      result: output.slice(0, 900),
      at: new Date().toISOString(),
    });
  };

  const run = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setOut(null);
    setSaved(false);
    r3signal(toolId, 'working', `Processing: ${text.slice(0, 90)}`);
    try {
      const res = await ai.generate('content', prompt(text, context));
      setOut({
        output: res.outcome.output,
        provider: res.outcome.provider,
        isBaseline: res.outcome.isBaseline,
        simulated: res.outcome.simulated,
      });
      r3signal(toolId, 'connected', `Real work done via ${res.outcome.provider}.`);
      recordPow(text, res.outcome.provider, title, res.outcome.output);
    } catch (e) {
      r3signal(toolId, 'failed', (e as Error).message);
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!out) return;
    try {
      if (onSave) {
        await onSave(out.output, input);
      } else {
        await collection.create('knowledge', {
          title: saveTitle ? saveTitle(input) : input.slice(0, 60) || title,
          kind,
          content: out.output,
          tags: [toolId],
        });
      }
      setSaved(true);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const copy = async () => {
    if (!out) return;
    await navigator.clipboard.writeText(out.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader
        title={title}
        sub={sub}
        right={
          <span className="flex items-center gap-2">
            {inR3 && node && (
              <span
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                title={node.note}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${node.status === 'working' ? 'animate-pulse' : ''}`}
                  style={{ background: R3_STATUS_COLORS[node.status] }}
                />
                <span style={{ color: R3_STATUS_COLORS[node.status] }}>{R3_STATUS_LABELS[node.status]}</span>
              </span>
            )}
            {inR3 && (
              <Link
                href="/dashboard/radial03"
                className="rounded-full px-2.5 py-0.5 text-[9px] font-bold transition-opacity hover:opacity-80"
                style={{ border: '1px solid rgba(155,108,255,0.4)', color: '#B9A8E8', background: 'rgba(124,58,237,0.12)' }}
              >
                $1600 radial →
              </Link>
            )}
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">
              {icon}{icon ? <span className="ml-0.5" /> : null}AI tool
            </span>
          </span>
        }
      />
      <div className="space-y-3 p-4 pt-2">
        {needConnection && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2">
            <Wifi className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <p className="min-w-0 flex-1 text-[11px] text-amber-200/90">
              Not connected to a live data source yet — <span className="text-amber-100">{NEEDS_INTEGRATION[toolId]}</span>.
            </p>
            <Link href="/dashboard/integrations" className="shrink-0 rounded-lg border border-amber-300/40 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200 transition-colors hover:bg-amber-400/20">
              Connect integration
            </Link>
          </div>
        )}
        <Textarea value={input} onChange={setInput} placeholder={placeholder} rows={3} />
        {examples.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 transition-colors hover:border-sky-400/40 hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Btn onClick={() => run(input)} disabled={busy || !input.trim()}>
            <Sparkles className="h-3.5 w-3.5" /> Generate
          </Btn>
          {context && (
            <span className="text-[10px] uppercase tracking-wider text-gray-600">
              Context loaded ({context.length} chars)
            </span>
          )}
        </div>

        {inR3 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-600">Run permission</span>
            {gated ? (
              <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300" title="Financial, legal or contractual actions always need a human approval before they execute.">
                <Lock className="h-3 w-3" /> Approval required — financial/legal/contractual
              </span>
            ) : (
              (['view', 'suggest', 'prepare', 'approve', 'execute', 'auto'] as R3Perm[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => r3SetPerm(toolId, p)}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold transition-colors ${perm === p ? 'text-white' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-gray-200'}`}
                  style={perm === p ? { borderColor: `${p === 'auto' ? '#20DDB1' : '#B26BFF'}88`, background: `${p === 'auto' ? '#20DDB1' : '#B26BFF'}22` } : undefined}
                >
                  {p === 'approve' ? <ShieldCheck className="h-3 w-3" /> : p === 'auto' ? <RefreshCw className="h-3 w-3" /> : null}
                  {R3_PERM_LABELS[p]}
                </button>
              ))
            )}
            {perm === 'auto' && (
              <span className="text-[9px] text-emerald-400">Auto-Execute is explicitly allowed for this tool.</span>
            )}
          </div>
        )}

        {busy && <Spinner label="Generating..." />}

        {out && (
          <div className="rounded-xl border border-white/10 bg-[#0a0a12] p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone={out.isBaseline ? 'amber' : 'green'}>
                {out.isBaseline ? 'Baseline draft' : `Live · ${out.provider}`}
              </Badge>
              {out.simulated && <Badge tone="gray">Simulated</Badge>}
              <span className="flex-1" />
              <Btn small kind="ghost" onClick={save} disabled={saved}>
                {saved ? <Check className="h-3 w-3 text-green-400" /> : <Save className="h-3 w-3" />} {saved ? 'Saved' : saveLabel}
              </Btn>
              <Btn small kind="ghost" onClick={copy}>
                {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} Copy
              </Btn>
              <Btn small kind="ghost" onClick={() => run(input)}>
                <RefreshCw className="h-3 w-3" />
              </Btn>
              <Btn small kind="ghost" onClick={() => setOut(null)}>
                <Trash2 className="h-3 w-3" />
              </Btn>
            </div>
            <p className="max-h-[420px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed text-gray-200">
              {out.output}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}