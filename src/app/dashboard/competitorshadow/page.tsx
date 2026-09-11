'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Field, Empty, Spinner } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

interface Note { id: string; title: string; content: string; updatedAt: string; }

export default function CompetitorShadowPage() {
  const notes = useCollection<Note>('knowledge', { tag: 'competitor' });
  const [fTitle, setFTitle] = useState('');
  const [fBody, setFBody] = useState('');

  const add = async () => {
    if (!fTitle.trim()) return;
    try {
      await collection.create('knowledge', { title: fTitle, kind: 'note', content: fBody, tags: ['competitor'] });
      setFTitle(''); setFBody(''); notes.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this watch note?')) return;
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
        <h1 className="text-lg font-bold">Competitor Shadow</h1>
        <p className="text-xs text-gray-500 mt-0.5">A watchlist on competitors with change alerts and counter-moves.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Watchlist" right={<Badge tone="purple">{notes.rows.length} watched</Badge>} />
            <div className="space-y-3 p-4">
              <Field label="What changed?"><Input value={fTitle} onChange={setFTitle} placeholder="e.g. Competitor launched a free tier" /></Field>
              <Field label="Detail / impact"><Input value={fBody} onChange={setFBody} placeholder="What they did, who it affects" /></Field>
              <Btn onClick={add} disabled={!fTitle.trim()}><Plus className="h-3.5 w-3.5" /> Log signal</Btn>
              {notes.loading ? (
                <Spinner label="Loading watchlist..." />
              ) : notes.rows.length === 0 ? (
                <Empty title="No signals logged" hint="Log competitor moves here, then ask for counter-moves below." />
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
          toolId="competitorshadow"
          title="Counter-move"
          sub="Given what they did, what do we do — and what do we refuse to do?"
          placeholder="e.g. They launched a free tier. What is our best counter-move?"
          examples={['They launched a free tier — our counter-move?', 'Is this move worth responding to at all?', 'What would they least like us to do right now?']}
          prompt={(input, ctx) =>
            `You are Competitor Shadow for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nAssess the move coolly: whether to respond at all, the counter-move with the best leverage, what to explicitly not do, and the timing. Avoid panic responses.`
          }
          saveTitle={(input) => `Counter-move — ${input.slice(0, 48)}`}
        />
      </div>
    </div>
  );
}