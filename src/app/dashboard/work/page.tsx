'use client';

import { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Select, Field, Empty, Spinner, Modal, Th, Td, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { useSession } from '@/components/platform/SessionProvider';

interface Task {
  id: string; title: string; description?: string; status: string; priority: string;
  assigneeId?: string; projectId?: string; dueDate?: string; createdAt: string; updatedAt: string;
}
interface Project {
  id: string; name: string; status: string; ownerId: string; memberIds: string[];
  deadline?: string; milestones: { id: string; title: string; done: boolean; dueDate?: string }[]; createdAt: string;
}

type Tab = 'tasks' | 'projects';

const prioTone = (p: string) => (p === 'urgent' ? 'red' : p === 'high' ? 'amber' : p === 'low' ? 'blue' : 'gray') as 'red' | 'amber' | 'blue' | 'gray';
const statusTone = (s: string) => (s === 'completed' ? 'green' : s === 'in_progress' ? 'blue' : s === 'cancelled' ? 'gray' : 'purple') as 'green' | 'blue' | 'gray' | 'purple';

export default function WorkPage() {
  const { me } = useSession();
  const [tab, setTab] = useState<Tab>('tasks');
  const [status, setStatus] = useState('all');
  const tasks = useCollection<Task>('tasks', { status });
  const projects = useCollection<Project>('projects', {});
  const [showTask, setShowTask] = useState(false);
  const [showProject, setShowProject] = useState(false);
  const [busy, setBusy] = useState(false);

  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fPriority, setFPriority] = useState('medium');
  const [fDue, setFDue] = useState('');
  const [fAssignee, setFAssignee] = useState('');
  const [fProject, setFProject] = useState('');

  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pDeadline, setPDeadline] = useState('');

  const members = me?.members ?? [];

  const createTask = async () => {
    if (!fTitle.trim()) return;
    setBusy(true);
    try {
      await collection.create('tasks', {
        title: fTitle, description: fDesc || undefined, priority: fPriority,
        assigneeId: fAssignee || undefined, projectId: fProject || undefined, dueDate: fDue || undefined,
      });
      setShowTask(false);
      setFTitle('');
      setFDesc('');
      setFDue('');
      setFAssignee('');
      setFProject('');
      tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const completeTask = async (id: string) => {
    try {
      await collection.update('tasks', id, { status: 'completed' });
      tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await collection.remove('tasks', id);
      tasks.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const createProject = async () => {
    if (!pName.trim()) return;
    setBusy(true);
    try {
      await collection.create('projects', { name: pName, description: pDesc || undefined, deadline: pDeadline || undefined });
      setShowProject(false);
      setPName('');
      setPDesc('');
      setPDeadline('');
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const memberName = (id?: string) => members.find((m) => m.id === id)?.name ?? 'Unassigned';
  const projectName = (id?: string) => projects.rows.find((p) => p.id === id)?.name ?? '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Tasks & Projects</h1>
          <p className="text-xs text-gray-500 mt-0.5">Work items scoped to the current workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['tasks', 'projects'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t === 'tasks' ? 'Tasks' : 'Projects'}
              </button>
            ))}
          </div>
          <Btn onClick={() => (tab === 'tasks' ? setShowTask(true) : setShowProject(true))}>
            <Plus className="w-3.5 h-3.5" /> {tab === 'tasks' ? 'New task' : 'New project'}
          </Btn>
        </div>
      </div>

      {tab === 'tasks' && (
        <>
          <div className="flex items-center gap-2">
            <Select value={status} onChange={setStatus} options={[
              { label: 'All statuses', value: 'all' },
              { label: 'To do', value: 'todo' },
              { label: 'In progress', value: 'in_progress' },
              { label: 'Review', value: 'review' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
            ]} />
          </div>
          <Card>
            {tasks.loading ? (
              <Spinner />
            ) : tasks.rows.length === 0 ? (
              <Empty title="No tasks yet" hint="Create your first task to start the pipeline." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/5"><tr>
                    <Th>Title</Th><Th>Status</Th><Th>Priority</Th><Th>Assignee</Th><Th>Project</Th><Th>Due</Th><Th>Updated</Th><Th></Th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {tasks.rows.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <Td className="font-medium text-white">{t.title}</Td>
                        <Td><Badge tone={statusTone(t.status)}>{t.status.replace('_', ' ')}</Badge></Td>
                        <Td><Badge tone={prioTone(t.priority)}>{t.priority}</Badge></Td>
                        <Td>{memberName(t.assigneeId)}</Td>
                        <Td className="text-gray-500">{projectName(t.projectId)}</Td>
                        <Td>{fmtDate(t.dueDate)}</Td>
                        <Td className="text-gray-500 text-xs">{fmtDate(t.updatedAt)}</Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            {t.status !== 'completed' ? (
                              <button onClick={() => completeTask(t.id)} title="Complete" className="p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-white/5"><Check className="w-4 h-4" /></button>
                            ) : null}
                            <button onClick={() => deleteTask(t.id)} title="Delete" className="p-1.5 rounded-md text-gray-500 hover:text-rose-400 hover:bg-white/5"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'projects' && (
        <div className="grid gap-3">
          {projects.loading ? (
            <Spinner />
          ) : projects.rows.length === 0 ? (
            <Empty title="No projects yet" hint="Projects group tasks, milestones, and people." />
          ) : (
            projects.rows.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.memberIds.length} member(s) · deadline {fmtDate(p.deadline)} · {p.milestones.filter((m) => m.done).length}/{p.milestones.length} milestones done
                    </p>
                  </div>
                  <Badge tone={statusTone(p.status)}>{p.status.replace('_', ' ')}</Badge>
                </div>
                {p.milestones.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.milestones.map((m) => (
                      <button
                        key={m.id}
                        onClick={async () => {
                          const n = p.milestones.find((x) => x.id === m.id);
                          if (n) n.done = !n.done;
                          try { await collection.update('projects', p.id, { status: p.status }); } catch { /* ignored */ }
                          projects.reload();
                        }}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${m.done ? 'border-emerald-500/30 text-emerald-300' : 'border-white/10 text-gray-400'}`}
                      >
                        <Check className="w-3 h-3" /> {m.title}
                      </button>
                    ))}
                  </div>
                ) : null}
              </Card>
            ))
          )}
        </div>
      )}

      <Modal open={showTask} onClose={() => setShowTask(false)} title="Create task" wide>
        <div className="space-y-3">
          <Field label="Title"><Input value={fTitle} onChange={setFTitle} placeholder="Ship the onboarding flow" /></Field>
          <Field label="Description"><Textarea value={fDesc} onChange={setFDesc} placeholder="What needs to happen?" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority"><Select value={fPriority} onChange={setFPriority} options={['low', 'medium', 'high', 'urgent'].map((p) => ({ label: p, value: p }))} /></Field>
            <Field label="Due date"><Input value={fDue} onChange={setFDue} type="date" /></Field>
            <Field label="Assignee"><Select value={fAssignee} onChange={setFAssignee} options={[{ label: 'Unassigned', value: '' }, ...members.map((m) => ({ label: m.name, value: m.id }))]} /></Field>
            <Field label="Project"><Select value={fProject} onChange={setFProject} options={[{ label: 'None', value: '' }, ...projects.rows.map((p) => ({ label: p.name, value: p.id }))]} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setShowTask(false)}>Cancel</Btn>
            <Btn onClick={createTask} disabled={busy || !fTitle.trim()}>Create task</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={showProject} onClose={() => setShowProject(false)} title="Create project">
        <div className="space-y-3">
          <Field label="Name"><Input value={pName} onChange={setPName} /></Field>
          <Field label="Description"><Textarea value={pDesc} onChange={setPDesc} /></Field>
          <Field label="Deadline"><Input value={pDeadline} onChange={setPDeadline} type="date" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setShowProject(false)}>Cancel</Btn>
            <Btn onClick={createProject} disabled={busy || !pName.trim()}>Create project</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}