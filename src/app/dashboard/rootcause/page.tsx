'use client';

import { useMemo } from 'react';
import { Card, CardHeader, Badge, Spinner, Empty, useAsync } from '@/components/platform/ui';
import { analytics } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

interface Insight {
  key: string;
  label: string;
  value: string;
  severity: 'good' | 'warn' | 'bad';
}

export default function RootCausePage() {
  const data = useAsync(() => analytics.get(), []);

  const insights = useMemo<Insight[]>(() => {
    if (!data.data?.insights) return [];
    return Object.entries(data.data.insights).map(([key, v]) => {
      const raw = String((v as { value?: unknown })?.value ?? String(v));
      return { key, label: key.replace(/[_-]/g, ' '), value: raw, severity: 'good' as const };
    });
  }, [data.data]);

  const notes = data.data?.notes ?? [];

  const context = `System observations:\n${notes.map((n: { severity: string; text: string }) => `- [${n.severity}] ${n.text}`).join('\n') || '  none recorded'}\nKey signals:\n${insights.slice(0, 8).map((i) => `- ${i.label}: ${i.value}`).join('\n') || '  none'}\n\nGiven a symptom, trace to the root cause and propose the smallest fix.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Root Cause</h1>
        <p className="text-xs text-gray-500 mt-0.5">From symptom to underlying cause before you act.</p>
      </div>

      <Card>
        <CardHeader title="System signals" right={<Badge tone="purple">{notes.length} observations</Badge>} />
        {data.loading ? (
          <Spinner label="Scanning the system..." />
        ) : notes.length === 0 ? (
          <Empty title="All quiet" hint="Signal notes will surface here as the system watches the workspace." />
        ) : (
          <ul className="divide-y divide-white/5">
            {notes.map((n: { severity: string; text: string }, i: number) => (
              <li key={i} className="flex items-start gap-2 px-4 py-2 text-xs">
                <Badge tone={n.severity === 'good' ? 'green' : n.severity === 'warn' ? 'amber' : 'red'}>{n.severity}</Badge>
                <span className="text-gray-300">{n.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="rootcause"
        title="Trace the Cause"
        sub="Describe the symptom; get the root cause and the smallest fix."
        placeholder="e.g. Deals keep stalling at the proposal stage. What is the root cause?"
        examples={['Deals stall at proposal — why?', 'Revenue is flat three months running. Root cause?', 'Tasks pile up every Friday. What is really happening?']}
        context={context}
        prompt={(input, ctx) =>
          `You are Root Cause for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nTrace like a detective: list 3 plausible causes, mark the most likely one, state the root cause in one sentence, and name the smallest fix that would collapse the problem.`
        }
        saveTitle={(input) => `Root cause — ${input.slice(0, 48)}`}
        kind="reference"
      />
    </div>
  );
}