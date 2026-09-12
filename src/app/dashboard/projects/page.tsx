'use client';

import { useState } from 'react';
import { FolderKanban, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Textarea, Empty, Spinner, Modal, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Project { id: string; name: string; description?: string; status: string; ownerId?: string; startDate?: string; deadline?: string; createdAt: string; }
interface Task { id: string; projectId?: string; status: string; }

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'archived'];

const statusTone = (s: string) =>
  s === 'active' ? 'green' : s === 'on_hold' ? 'amber' : s === 'completed' ? 'blue' : s === 'archived' ? 'gray' : 'gray';

export default function ProjectsPage() {
  const projects = useCollection<Project>('projects', {});
  const tasks = useCollection<Task>('tasks', {});
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = projects.rows.filter((p) => (q ? (p.name + (p.description ?? '')).toLowerCase().includes(q.toLowerCase()) : true));

  const tasksFor = (id: string) => tasks.rows.filter((t) => t.projectId === id);
  const openTasksFor = (id: string) => tasksFor(id).filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await collection.create('projects', { name: name.trim(), description: description || undefined, status, deadline: deadline || undefined });
      setName(''); setDescription(''); setStatus('planning'); setDeadline('');
      setOpen(false);
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (p: Project, next: string) => {
    try {
      await collection.update('projects', p.id, { status: next });
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete project "${p.name}"?`)) return;
    try {
      await collection.remove('projects', p.id);
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const activeCount = projects.rows.filter((p) => p.status === 'active').length;
  const onHold = projects.rows.filter((p) => p.status === 'on_hold').length;
  const completed = projects.rows.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Projects</h1>
          <p className="mt-0.5 text-xs text-gray-500">Portfolio health, progress, and delivery risk.</p>
        </div>
        <Btn kind="solid" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New project</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Portfolio</p><p className="mt-1.5 text-2xl font-bold text-white">{projects.rows.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Active</p><p className="mt-1.5 text-2xl font-bold text-[#00D9B2]">{activeCount}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">On hold</p><p className="mt-1.5 text-2xl font-bold text-amber-400">{onHold}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Completed</p><p className="mt-1.5 text-2xl font-bold text-[#438BFF]">{completed}</p></Card>
      </div>

      <Card>
        <CardHeader
          title="Portfolio"
          right={
            <div className="flex items-center gap-2">
              <Input value={q} onChange={setQ} placeholder="Search projects" className="w-48" />
              <Badge tone="purple">{rows.length}</Badge>
            </div>
          }
        />
        {projects.loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty title={q ? 'No projects match' : 'No projects yet'} hint="Create a project, anchor tasks to it, and the portfolio panel will track delivery health." />
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((p) => {
              const open = openTasksFor(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <FolderKanban className="h-4 w-4 shrink-0 text-[#438BFF]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">{p.name}</p>
                    <p className="text-[11px] text-gray-500">
                      created {fmtDate(p.createdAt)}
                      {p.deadline && <> · due <span className="text-gray-400">{p.deadline}</span></>}
                      <span className="ml-2 text-gray-600">· {tasksFor(p.id).length} tasks · {open} open</span>
                      {open > 0 && <span className="ml-1.5 inline-flex items-center gap-1 text-amber-400"><TriangleAlert className="h-3 w-3" /></span>}
                    </p>
                  </div>
                  <Select
                    value={p.status}
                    onChange={(v) => updateStatus(p, v)}
                    className="w-32"
                    options={PROJECT_STATUSES.map((s) => ({ label: s.replace('_', ' '), value: s }))}
                  />
                  <Badge tone={statusTone(p.status) as never}>{p.status.replace('_', ' ')}</Badge>
                  <button type="button" onClick={() => remove(p)} className="p-1 text-gray-600 hover:text-rose-400" title="Delete project">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New project">
        <div className="space-y-3">
          <Field label="Name"><Input value={name} onChange={setName} placeholder="Project name" /></Field>
          <Field label="Description"><Textarea value={description} onChange={setDescription} rows={2} placeholder="Optional" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={status} onChange={setStatus} options={PROJECT_STATUSES.map((s) => ({ label: s.replace('_', ' '), value: s }))} />
            </Field>
            <Field label="Deadline"><Input value={deadline} onChange={setDeadline} type="date" /></Field>
          </div>
          <Btn kind="solid" disabled={busy || !name.trim()} onClick={create} className="w-full">
            {busy ? 'Creating…' : 'Create project'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}