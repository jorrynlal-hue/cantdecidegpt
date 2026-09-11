'use client';

import { useState, type ReactNode } from 'react';
import { Sparkles, Copy, Check, Save, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Textarea, Spinner } from '@/components/platform/ui';
import { ai, collection } from '@/lib/core/client';

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
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setOut(null);
    setSaved(false);
    try {
      const res = await ai.generate('content', prompt(text, context));
      setOut({
        output: res.outcome.output,
        provider: res.outcome.provider,
        isBaseline: res.outcome.isBaseline,
        simulated: res.outcome.simulated,
      });
    } catch (e) {
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
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">
            {icon}{icon ? <span className="ml-0.5" /> : null}AI tool
          </span>
        }
      />
      <div className="space-y-3 p-4 pt-2">
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