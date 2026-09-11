'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Field, Select, Empty, Spinner, Modal, Th, Td, Stat, fmtDateTime } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

interface CalEvent {
  id: string; title: string; start: string; end?: string; allDay?: boolean; kind?: string; createdAt: string;
}
interface Task {
  id: string; title: string; status: string; priority: string; dueDate?: string;
}

const kindTone = (k?: string): 'purple' | 'blue' | 'amber' | 'green' | 'gray' =>
  k === 'meeting' ? 'blue' : k === 'call' ? 'purple' : k === 'focus' ? 'amber' : k === 'reminder' ? 'green' : 'gray';

const EVENT_KINDS = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Call' },
  { value: 'focus', label: 'Focus block' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'custom', label: 'Custom' },
];

export default function SchedulerPage() {
  const events = useCollection<CalEvent>('events');
  const tasks = useCollection<Task>('tasks');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fStart, setFStart] = useState('');
  const [fEnd, setFEnd] = useState('');
  const [fKind, setFKind] = useState('meeting');

  const now = new Date().toISOString();
  const upcoming = events.rows.filter((e) => e.start >= now).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 12);
  const open = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status));

  const context =
    upcoming.length > 0 || open.length > 0
      ? `Calendar (next):\n${upcoming.map((e) => `- ${fmtDateTime(e.start)} ${e.title}${e.kind ? ` [${e.kind}]` : ''}`).join('\n') || '  none scheduled'}\n\nOpen tasks (${open.length}):\n${open.slice(0, 8).map((t) => `- ${t.title}${t.priority ? ` [${t.priority}]` : ''}${t.dueDate ? ` due ${fmtDateTime(t.dueDate)}` : ''}`).join('\n')}\n\nBuild a realistic weekly plan that puts first things first.`
      : '';

  const create = async () => {
    if (!fTitle.trim() || !fStart) return;
    setBusy(true);
    try {
      await collection.create('events', { title: fTitle, start: fStart, end: fEnd || undefined, kind: fKind });
      setShow(false); setFTitle(''); setFStart(''); setFEnd(''); setFKind('meeting');
      events.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await collection.remove('events', id);
      events.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Scheduler</h1>
          <p className="text-xs text-gray-500 mt-0.5">Plan the week, block focus and keep delivery on the calendar.</p>
        </div>
        <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> Add Event</Btn>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Upcoming" value={upcoming.length} tone="good" />
        <Stat label="Open tasks" value={open.length} tone="warn" />
        <Stat label="Scheduled" value={events.rows.length} />
      </div>

      <Card>
        <CardHeader title="Upcoming Calendar" right={<Badge tone="purple">{upcoming.length} events</Badge>} />
        {events.loading ? (
          <Spinner label="Loading calendar..." />
        ) : upcoming.length === 0 ? (
          <Empty title="Nothing scheduled" hint="Add an event or generate a weekly plan." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>When</Th><Th>Title</Th><Th>Kind</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {upcoming.map((e) => (
                <tr key={e.id} className="border-t border-white/5">
                  <Td>{fmtDateTime(e.start)}</Td>
                  <Td><span className="font-medium text-gray-100">{e.title}</span></Td>
                  <Td><Badge tone={kindTone(e.kind)}>{e.kind ?? 'custom'}</Badge></Td>
                  <Td className="text-right">
                    <Btn small kind="danger" onClick={() => remove(e.id)}><Trash2 className="h-3 w-3" /></Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <AIMemo
        toolId="scheduler"
        title="Weekly Plan"
        sub="Generates a sequenced plan from your calendar and open tasks."
        placeholder="e.g. Plan my week around closing the pricing project and carving out two deep-work afternoons."
        examples={['Plan the week, protecting focus blocks first', 'Find 3 slots this week for deep work between meetings', 'Sequence my tasks by deadline from today']}
        context={context || undefined}
        prompt={(input, ctx) =>
          `You are the Scheduler for the Imprint operating system. ${ctx ? `${ctx}\n\n` : ''}Instructions from the user: ${input}\n\nGive: (1) a day-by-day plan, (2) protected focus blocks, (3) the single most important outcome this week. Be concrete and realistic.`
        }
        saveTitle={(input) => `Weekly plan — ${input.slice(0, 48)}`}
      />

      <Modal open={show} onClose={() => setShow(false)} title="Add Event">
        <div className="space-y-3">
          <Field label="Title"><Input value={fTitle} onChange={setFTitle} placeholder="Event title" /></Field>
          <Field label="Starts"><Input type="datetime-local" value={fStart} onChange={setFStart} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ends"><Input type="datetime-local" value={fEnd} onChange={setFEnd} /></Field>
            <Field label="Kind">
              <Select value={fKind} onChange={setFKind} options={EVENT_KINDS} />
            </Field>
          </div>
          <Btn onClick={create} disabled={busy || !fTitle.trim() || !fStart}>Add event</Btn>
        </div>
      </Modal>
    </div>
  );
}