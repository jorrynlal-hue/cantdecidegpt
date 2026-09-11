'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Field, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

interface Task { id: string; title: string; status: string; priority: string; }

export default function ErrandsPage() {
  const tasks = useCollection<Task>('tasks');
  const [fTitle, setFTitle] = useState('');

  const add = async () => {
    if (!fTitle.trim()) return;
    try {
      await collection.create('tasks', { title: fTitle, priority: 'high' });
      setFTitle(''); tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this errand?')) return;
    try {
      await collection.remove('tasks', id);
      tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const open = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status));
  const done = tasks.rows.filter((t) => t.status === 'completed').length;

  const context = `Errands on the list:\n${open.slice(0, 12).map((t, i) => `${i + 1}. ${t.title}`).join('\n') || '  (list empty)'}\n\nSequence them into one efficient run: group by area, then by shop/stop order.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Errand Brain</h1>
        <p className="text-xs text-gray-500 mt-0.5">Every errand sequenced into one efficient run.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="On the list" value={open.length} tone="warn" />
        <Stat label="Done" value={done} tone="good" />
        <Stat label="Focus" value={1} tone="accent" />
      </div>

      <Card>
        <CardHeader title="Current errands" right={<Badge tone="purple">{open.length} stops</Badge>} />
        <div className="flex gap-2 p-4">
          <Field label=""><Input value={fTitle} onChange={setFTitle} placeholder="e.g. Pick up dry cleaning (Main St)" /></Field>
          <Btn onClick={add} disabled={!fTitle.trim()}><Plus className="h-3.5 w-3.5" /></Btn>
        </div>
        {tasks.loading ? (
          <Spinner label="Loading errands..." />
        ) : open.length === 0 ? (
          <Empty title="Nothing to run" hint="Add errands, then generate the route below." />
        ) : (
          <ul className="divide-y divide-white/5">
            {open.slice(0, 12).map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="font-medium text-gray-100">{t.title}</span>
                <Btn small kind="danger" onClick={() => remove(t.id)}><Trash2 className="h-3 w-3" /></Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="errands"
        title="Sequence the Run"
        sub="One out-and-back route that clears the list in a single trip."
        placeholder="e.g. Sequence these into one run starting from home."
        examples={['Sequence these into one efficient run', 'Group the errands by area, then by stop order', 'Tell me which errands can wait']}
        context={context}
        prompt={(input, ctx) =>
          `You are Errand Brain for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nSequence the run: the route order with a one-line why, grouping by area, which stops combine naturally, and which errands can wait. Keep it to one trip.`
        }
        saveTitle={(input) => `Errand run — ${input.slice(0, 48)}`}
      />
    </div>
  );
}