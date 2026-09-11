'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Field, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

interface Note { id: string; title: string; content: string; }

export default function LifeAdminPage() {
  const notes = useCollection<Note>('knowledge', { kind: 'paperwork' });
  const [fTitle, setFTitle] = useState('');
  const [fBody, setFBody] = useState('');

  const add = async () => {
    if (!fTitle.trim()) return;
    try {
      await collection.create('knowledge', { title: fTitle, kind: 'paperwork', content: fBody, tags: ['lifeadmin'] });
      setFTitle(''); setFBody(''); notes.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this item?')) return;
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
        <h1 className="text-lg font-bold">Life Admin</h1>
        <p className="text-xs text-gray-500 mt-0.5">Renewals, paperwork and the life backlog you keep postponing.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Paperwork items" value={notes.rows.length} tone="warn" />
        <Stat label="This week" value={0} />
        <Stat label="Backlog" value={notes.rows.length} tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader title="The Life Backlog" right={<Badge tone="purple">{notes.rows.length} items</Badge>} />
            <div className="space-y-3 p-4">
              <Field label="Item"><Input value={fTitle} onChange={setFTitle} placeholder="e.g. Renew car registration (due 30 Sep)" /></Field>
              <Field label="Detail"><Input value={fBody} onChange={setFBody} placeholder="Renewal window, cost, who to call" /></Field>
              <Btn onClick={add} disabled={!fTitle.trim()}><Plus className="h-3.5 w-3.5" /> Add item</Btn>
              {notes.loading ? (
                <Spinner label="Loading backlog..." />
              ) : notes.rows.length === 0 ? (
                <Empty title="Backlog empty" hint="Add renewals and paperwork here so nothing lapses." />
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
          toolId="lifeadmin"
          title="Clear the Backlog"
          sub="Turn the list above into a done-by-Sunday plan."
          placeholder="e.g. Give me a 10-minute-a-day plan to clear this paperwork without it taking over the week."
          examples={['Make a 10-min-a-day plan to clear this backlog', 'Which items expire or cost money if late? Prioritize them', 'Draft the emails/letters I need for item #1']}
          prompt={(input, ctx) =>
            `You are Life Admin for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nGive: the order to tackle items (by cost of being late), a daily 10-minute plan for the week, and a ready-to-send draft for the first item.`
          }
          saveTitle={(input) => `Life admin plan — ${input.slice(0, 48)}`}
          kind="reference"
        />
      </div>
    </div>
  );
}