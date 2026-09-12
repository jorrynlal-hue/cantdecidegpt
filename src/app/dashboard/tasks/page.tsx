'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Plus, XCircle } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Textarea, Empty, Spinner, Modal, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Task { id: string; title: string; description?: string; status: string; priority: string; dueDate?: string; projectId?: string; createdAt: string; }
interface Project { id: string; name: string; status: string; }

const STATUSES = ['todo', 'in_progress', 'review', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const statusTone = (s: string) =>
  s === 'completed' ? 'green' : s === 'in_progress' ? 'blue' : s === 'review' ? 'amber' : s === 'cancelled' ? 'gray' : 'gray';
const priorTone = (p: string) => (p === 'urgent' ? 'red' : p === 'high' ? 'amber' : p === 'medium' ? 'blue' : 'gray');

export default function TasksPage() {
  const tasks = useCollection<Task>('tasks', {});
  const projects = useCollection<Project>('projects', {});
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = tasks.rows
    .filter((t) => (status === 'all' ? true : t.status === status))
    .filter((t) => (q ? t.title.toLowerCase().includes(q.toLowerCase()) : true));

  const counts = (s: string) => (s === 'all' ? tasks.rows.length : tasks.rows.filter((t) => t.status === s).length);
  const openCount = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await collection.create('tasks', { title: title.trim(), description: description || undefined, status: 'todo', priority, dueDate: dueDate || undefined, projectId: projectId || undefined });
      setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setProjectId('');
      setOpen(false);
      tasks.reload(); projects.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const advance = async (t: Task) => {
    const next = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'review' : t.status === 'review' ? 'completed' : 'completed';
    try {
      await collection.update('tasks', t.id, { status: next });
      tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Tasks</h1>
          <p className="mt-0.5 text-xs text-gray-500">Task calendar and execution — plan and run tasks with the AI workforce.</p>
        </div>
        <Btn kind="solid" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New task</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Total</p><p className="mt-1.5 text-2xl font-bold text-white">{tasks.rows.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Open work</p><p className="mt-1.5 text-2xl font-bold text-[#438BFF]">{openCount}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">In progress</p><p className="mt-1.5 text-2xl font-bold text-amber-400">{counts('in_progress')}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Completed</p><p className="mt-1.5 text-2xl font-bold text-[#00D9B2]">{counts('completed')}</p></Card>
      </div>

      <Card>
        <CardHeader
          title="Task queue"
          right={
            <div className="flex items-center gap-2">
              <Input value={q} onChange={setQ} placeholder="Search tasks" className="w-44" />
              <Select
                value={status}
                onChange={setStatus}
                className="w-36"
                options={[{ label: 'All statuses', value: 'all' }, ...STATUSES.map((s) => ({ label: s.replace('_', ' '), value: s }))]}
              />
            </div>
          }
        />
        {tasks.loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty title={q || status !== 'all' ? 'No tasks match' : 'No tasks yet'} hint="Create your first task and the workforce will start on it." />
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <button type="button" onClick={() => advance(t)} className="text-gray-600 hover:text-[#00D9B2]" title="Advance status">
                  {t.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-[#00D9B2]" /> : t.status === 'cancelled' ? <XCircle className="h-4 w-4 text-gray-600" /> : <Circle className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-100">{t.title}</p>
                  <p className="text-[11px] text-gray-500">
                    created {fmtDate(t.createdAt)}
                    {t.dueDate && <> · due <span className="text-gray-400">{t.dueDate}</span></>}
                    {t.projectId && <> · {projects.rows.find((p) => p.id === t.projectId)?.name ?? 'project'}</>}
                  </p>
                </div>
                <Badge tone={priorTone(t.priority)}>{t.priority}</Badge>
                <Badge tone={statusTone(t.status) as never}>{t.status.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New task">
        <div className="space-y-3">
          <Field label="Title"><Input value={title} onChange={setTitle} placeholder="What needs doing?" /></Field>
          <Field label="Description"><Textarea value={description} onChange={setDescription} rows={2} placeholder="Optional details" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select value={priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ label: p, value: p }))} />
            </Field>
            <Field label="Due date"><Input value={dueDate} onChange={setDueDate} type="date" /></Field>
          </div>
          <Field label="Project">
            <Select
              value={projectId}
              onChange={setProjectId}
              options={[{ label: 'No project', value: '' }, ...projects.rows.map((p) => ({ label: p.name, value: p.id }))]}
            />
          </Field>
          <Btn kind="solid" disabled={busy || !title.trim()} onClick={create} className="w-full">
            {busy ? 'Creating…' : 'Create task'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}