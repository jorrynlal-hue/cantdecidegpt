'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Field, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

interface Note { id: string; title: string; content: string; }

export default function HouseholdPage() {
  const notes = useCollection<Note>('knowledge', { tag: 'household' });
  const [fTitle, setFTitle] = useState('');
  const [fBody, setFBody] = useState('');

  const add = async () => {
    if (!fTitle.trim()) return;
    try {
      await collection.create('knowledge', { title: fTitle, kind: 'note', content: fBody, tags: ['household'] });
      setFTitle(''); setFBody(''); notes.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this task?')) return;
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
        <h1 className="text-lg font-bold">Household</h1>
        <p className="text-xs text-gray-500 mt-0.5">Shared home responsibilities kept fair and visible.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="On the board" value={notes.rows.length} tone="warn" />
        <Stat label="Calendar" value={0} />
        <Stat label="Fairness" value={'live'} tone="good" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader title="The House Board" right={<Badge tone="purple">{notes.rows.length} tasks</Badge>} />
            <div className="space-y-3 p-4">
              <Field label="Task"><Input value={fTitle} onChange={setFTitle} placeholder="e.g. Take out recycling (Tuesdays)" /></Field>
              <Field label="Owner / detail"><Input value={fBody} onChange={setFBody} placeholder="Who, when, how often" /></Field>
              <Btn onClick={add} disabled={!fTitle.trim()}><Plus className="h-3.5 w-3.5" /> Add task</Btn>
              {notes.loading ? (
                <Spinner label="Loading the board..." />
              ) : notes.rows.length === 0 ? (
                <Empty title="Board is clean" hint="Add household tasks and keep the split fair." />
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
          toolId="household"
          title="Fair Split"
          sub="A week plan that keeps the load fair and the house running."
          placeholder="e.g. Split this week's household load fairly between two people."
          examples={['Split this week’s load fairly', 'Build a Sunday night chore plan', 'What can be automated, delegated or dropped?']}
          prompt={(input, ctx) =>
            `You are Household Ops for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nProduce the week plan: a fair split across the people in the house, when each task runs, and what can be automated, delegated or dropped. Keep it simple enough to actually follow.`
          }
          saveTitle={(input) => `Household plan — ${input.slice(0, 48)}`}
        />
      </div>
    </div>
  );
}