'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Badge, Btn, Input, Field, Empty, Spinner, Modal, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface EventRow { id: string; title: string; start: string; end?: string; allDay?: boolean; kind: string; createdAt: string; }
interface Task { id: string; title: string; dueDate?: string; status: string; }
interface Project { id: string; name: string; deadline?: string; }

export default function CalendarPage() {
  const events = useCollection<EventRow>('events', {});
  const tasks = useCollection<Task>('tasks', { status: 'all' });
  const projects = useCollection<Project>('projects', {});
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(true);

  const rows = useMemo(() => {
    const list: { date: string; kind: string; title: string; id: string; deletable?: boolean }[] = [];
    events.rows.forEach((e) => list.push({ date: e.start.slice(0, 10), kind: e.kind, title: e.title, id: e.id, deletable: true }));
    tasks.rows.forEach((t) => t.dueDate && list.push({ date: t.dueDate, kind: 'task', title: `[Task] ${t.title}`, id: t.id }));
    projects.rows.forEach((p) => p.deadline && list.push({ date: p.deadline, kind: 'deadline', title: `[Project deadline] ${p.name}`, id: p.id }));
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [events.rows, tasks.rows, projects.rows]);

  const byDate = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    rows.forEach((r) => (map[r.date] ??= []).push(r));
    return map;
  }, [rows]);

  const create = async () => {
    if (!title.trim() || !start) return;
    try {
      await collection.create('events', { title, start, allDay, end: end || undefined });
      setShow(false);
      setTitle('');
      setStart('');
      events.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const del = async (id: string) => {
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
          <h1 className="text-lg font-bold">Calendar</h1>
          <p className="text-xs text-gray-500 mt-0.5">Your events plus real task due dates and project deadlines.</p>
        </div>
        <Btn onClick={() => setShow(true)}><Plus className="w-3.5 h-3.5" /> New event</Btn>
      </div>

      {events.loading ? <Spinner label="Loading calendar..." /> : (
        <div className="space-y-4">
          {Object.entries(byDate).length === 0 ? (
            <Empty title="Nothing scheduled yet" hint="Create an event or give a task a due date and it appears here." />
          ) : (
            Object.entries(byDate).map(([date, items]) => (
              <Card key={date} className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold mb-2">{fmtDate(date)}</p>
                <div className="space-y-1.5">
                  {items.map((r) => (
                    <div key={`${r.kind}-${r.id}-${r.title}`} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={r.kind === 'task' ? 'blue' : r.kind === 'deadline' ? 'amber' : 'gray'}>{r.kind}</Badge>
                        <span className="text-sm text-gray-300">{r.title}</span>
                      </div>
                      {r.deletable ? (
                        <button onClick={() => del(r.id)} className="p-1 rounded-md text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <Modal open={show} onClose={() => setShow(false)} title="New event">
        <div className="space-y-3">
          <Field label="Title"><Input value={title} onChange={setTitle} /></Field>
          <Field label="Date"><Input value={start} onChange={setStart} type="date" /></Field>
          <Field label="End (optional)"><Input value={end} onChange={setEnd} type="date" /></Field>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-purple-500" />
            All day
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setShow(false)}>Cancel</Btn>
            <Btn onClick={create} disabled={!title.trim() || !start}>Create</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}