'use client';

import { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Select, Field, Empty, Spinner, Modal, Th, Td, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Task {
  id: string; title: string; description?: string; status: string; priority: string;
  assigneeId?: string; projectId?: string; dueDate?: string; createdAt: string; updatedAt: string;
}

const prioTone = (p: string) => (p === 'urgent' ? 'red' : p === 'high' ? 'amber' : p === 'low' ? 'blue' : 'gray') as 'red' | 'amber' | 'blue' | 'gray';
const statusTone = (s: string) => (s === 'completed' ? 'green' : s === 'in_progress' ? 'blue' : s === 'cancelled' ? 'gray' : 'purple') as 'green' | 'blue' | 'gray' | 'purple';

export default function TasksPage() {
  const [status, setStatus] = useState('all');
  const tasks = useCollection<Task>('tasks', { status });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fPriority, setFPriority] = useState('medium');
  const [fDue, setFDue] = useState('');

  const create = async () => {
    if (!fTitle.trim()) return;
    setBusy(true);
    try {
      await collection.create('tasks', { title: fTitle, description: fDesc || undefined, priority: fPriority, dueDate: fDue || undefined });
      setShow(false); setFTitle(''); setFDesc(''); setFDue('');
      tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const setStatusOf = async (id: string, next: string) => {
    try {
      await collection.update('tasks', id, { status: next });
      tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await collection.remove('tasks', id);
      tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const open = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;
  const done = tasks.rows.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Tasks</h1>
          <p className="text-xs text-gray-500 mt-0.5">{open} open · {done} completed in this workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {['all', 'todo', 'in_progress', 'completed'].map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 text-xs font-medium ${status === s ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> New Task</Btn>
        </div>
      </div>

      <Card>
        <CardHeader title="Task Queue" right={<Badge tone="purple">{tasks.rows.length} total</Badge>} />
        {tasks.loading ? (
          <Spinner label="Loading tasks..." />
        ) : tasks.rows.length === 0 ? (
          <Empty title="No tasks yet" hint="Create a task to start tracking work." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Title</Th><Th>Status</Th><Th>Priority</Th><Th>Due</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {tasks.rows.map((t) => (
                <tr key={t.id} className="border-t border-white/5">
                  <Td><span className="font-medium text-gray-100">{t.title}</span></Td>
                  <Td><Badge tone={statusTone(t.status)}>{t.status}</Badge></Td>
                  <Td><Badge tone={prioTone(t.priority)}>{t.priority}</Badge></Td>
                  <Td>{fmtDate(t.dueDate)}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status !== 'completed' && (
                        <Btn small kind="ghost" onClick={() => setStatusOf(t.id, 'completed')}><Check className="h-3 w-3" /> Done</Btn>
                      )}
                      {t.status === 'completed' && (
                        <Btn small kind="ghost" onClick={() => setStatusOf(t.id, 'todo')}>Reopen</Btn>
                      )}
                      <Btn small kind="danger" onClick={() => remove(t.id)}><Trash2 className="h-3 w-3" /></Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title="Create Task">
        <div className="space-y-3">
          <Field label="Title"><Input value={fTitle} onChange={setFTitle} placeholder="Task title" /></Field>
          <Field label="Description"><Textarea value={fDesc} onChange={setFDesc} placeholder="Optional details" rows={2} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select value={fPriority} onChange={setFPriority} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']].map(([v, l]) => ({ value: v, label: l }))} />
            </Field>
            <Field label="Due date"><Input type="date" value={fDue} onChange={setFDue} /></Field>
          </div>
          <Btn onClick={create} disabled={busy || !fTitle.trim()}>Create task</Btn>
        </div>
      </Modal>
    </div>
  );
}