'use client';

import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Select, Field, Empty, Spinner, Modal, Th, Td, Stat, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Project {
  id: string; name: string; description?: string; status: string;
  startDate?: string; deadline?: string; ownerId?: string; memberIds?: string[];
  customerId?: string; createdAt: string; updatedAt: string;
}

const statusTone = (s: string): 'purple' | 'green' | 'amber' | 'gray' =>
  s === 'active' ? 'green' : s === 'on_hold' ? 'amber' : s === 'completed' || s === 'archived' ? 'gray' : 'purple';

const PROJECT_STATUSES: { value: string; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export default function ProjectsPage() {
  const projects = useCollection<Project>('projects');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fStatus, setFStatus] = useState('planning');
  const [fStart, setFStart] = useState('');
  const [fDeadline, setFDeadline] = useState('');

  const create = async () => {
    if (!fName.trim()) return;
    setBusy(true);
    try {
      await collection.create('projects', { name: fName, description: fDesc || undefined, status: fStatus, startDate: fStart || undefined, deadline: fDeadline || undefined });
      setShow(false); setFName(''); setFDesc(''); setFStatus('planning'); setFStart(''); setFDeadline('');
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const setStatusOf = async (id: string, next: string) => {
    try {
      await collection.update('projects', id, { status: next });
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await collection.remove('projects', id);
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const active = projects.rows.filter((p) => p.status === 'active').length;
  const onHold = projects.rows.filter((p) => p.status === 'on_hold').length;
  const done = projects.rows.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Projects</h1>
          <p className="text-xs text-gray-500 mt-0.5">Portfolio health and delivery across every active project.</p>
        </div>
        <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> New Project</Btn>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active" value={active} tone="good" />
        <Stat label="On hold" value={onHold} tone="warn" />
        <Stat label="Completed" value={done} />
      </div>

      <Card>
        <CardHeader title="Project Pipeline" right={<Badge tone="purple">{projects.rows.length} total</Badge>} />
        {projects.loading ? (
          <Spinner label="Loading projects..." />
        ) : projects.rows.length === 0 ? (
          <Empty title="No projects yet" hint="Create a project to start tracking delivery." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Project</Th><Th>Status</Th><Th>Start</Th><Th>Deadline</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {projects.rows.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <Td><span className="font-medium text-gray-100">{p.name}</span></Td>
                  <Td><Badge tone={statusTone(p.status)}>{p.status}</Badge></Td>
                  <Td>{fmtDate(p.startDate)}</Td>
                  <Td>{fmtDate(p.deadline)}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status !== 'completed' && (
                        <Btn small kind="ghost" onClick={() => setStatusOf(p.id, 'completed')}><Check className="h-3 w-3" /> Complete</Btn>
                      )}
                      {p.status === 'completed' && (
                        <Btn small kind="ghost" onClick={() => setStatusOf(p.id, 'active')}>Reopen</Btn>
                      )}
                      <Btn small kind="danger" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title="Create Project">
        <div className="space-y-3">
          <Field label="Name"><Input value={fName} onChange={setFName} placeholder="Project name" /></Field>
          <Field label="Description"><Textarea value={fDesc} onChange={setFDesc} placeholder="Optional details" rows={2} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={fStatus} onChange={setFStatus} options={PROJECT_STATUSES} />
            </Field>
            <Field label="Deadline"><Input type="date" value={fDeadline} onChange={setFDeadline} /></Field>
          </div>
          <Field label="Start date"><Input type="date" value={fStart} onChange={setFStart} /></Field>
          <Btn onClick={create} disabled={busy || !fName.trim()}>Create project</Btn>
        </div>
      </Modal>
    </div>
  );
}