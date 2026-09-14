'use client';

import { Card, CardHeader, Badge, Empty, Spinner } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Btn, Input, Field } from '@/components/platform/ui';
import { AIMemo } from '@/components/platform/AIMemo';

interface Note { id: string; title: string; content: string; }

export default function PricingPage() {
  const notes = useCollection<Note>('knowledge', { tag: 'pricingexp' });
  const [fTitle, setFTitle] = useState('');
  const [fBody, setFBody] = useState('');

  const add = async () => {
    if (!fTitle.trim()) return;
    try {
      await collection.create('knowledge', { title: fTitle, kind: 'note', content: fBody, tags: ['pricingexp'] });
      setFTitle(''); setFBody(''); notes.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this experiment note?')) return;
    try {
      await collection.remove('knowledge', id);
      notes.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Pricing Experiments</h1>
        <p className="text-xs text-gray-500 mt-0.5">A/B pricing ideas with guardrails, tracking and a recommendation.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Experiment tracker" right={<Badge tone="purple">{notes.rows.length} ideas</Badge>} />
            <div className="space-y-3 p-4">
              <Field label="Idea"><Input value={fTitle} onChange={setFTitle} placeholder="e.g. Anchor at $499, sell at $349" /></Field>
              <Field label="Notes"><Input value={fBody} onChange={setFBody} placeholder="Guardrail / target audience / measure" /></Field>
              <Btn onClick={add} disabled={!fTitle.trim()}><Plus className="h-3.5 w-3.5" /> Track idea</Btn>
              {notes.loading ? (
                <Spinner label="Loading tracker..." />
              ) : notes.rows.length === 0 ? (
                <Empty title="No experiments tracked" hint="Track your A/B ideas here, then generate recommendations below." />
              ) : (
                <ul className="divide-y divide-white/5">
                  {notes.rows.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-2 py-2">
                      <div>
                        <p className="text-xs font-medium text-gray-100">{n.title}</p>
                        {n.content && <p className="text-[10px] text-gray-500">{n.content}</p>}
                      </div>
                      <Btn small kind="danger" onClick={() => remove(n.id)}><Trash2 className="h-3 w-3" /></Btn>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <AIMemo
          toolId="pricingexp"
          title="Recommendation Engine"
          sub="Turn tracked ideas into a safe, measurable experiment plan."
          placeholder="e.g. Recommend the next pricing experiment and its guardrails."
          examples={['Recommend the next pricing experiment', 'Design an A/B test with clear metrics and guardrails', 'What should I test first — anchoring or bundling?']}
          prompt={(input, ctx) =>
            `You are Pricing Experiments for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nFor the experiment: the hypothesis, the exact test design, the metric that decides it, and hard guardrails (what would stop it). Be skeptical of your own recommendation.`
          }
          saveTitle={(input) => `Pricing experiment — ${input.slice(0, 48)}`}
        />
      </div>
    </div>
  );
}