'use client';

import { useState } from 'react';
import { Plus, Trash2, Heart } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Select, Field, Empty, Spinner, Modal, Th, Td, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Customer {
  id: string; type: string; name: string; email?: string; phone?: string; company?: string; notes?: string;
  tags: string[]; updatedAt: string; createdAt: string;
}

export default function CustomersPage() {
  const customers = useCollection<Customer>('customers', {});
  const deals = useCollection<{ id: string; name: string; customerId?: string; value: number; stage: string }>('deals', {});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cName, setCName] = useState('');
  const [cType, setCType] = useState('contact');
  const [cEmail, setCEmail] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cTags, setCTags] = useState('');

  const create = async () => {
    if (!cName.trim()) return;
    setBusy(true);
    try {
      await collection.create('customers', {
        name: cName, type: cType, email: cEmail || undefined, company: cCompany || undefined,
        tags: cTags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setShow(false); setCName(''); setCType('contact'); setCEmail(''); setCCompany(''); setCTags('');
      customers.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await collection.remove('customers', id);
      customers.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const pipelineFor = (id: string) => deals.rows.filter((d) => d.customerId === id).reduce((a, d) => a + d.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Customers</h1>
          <p className="text-xs text-gray-500 mt-0.5">Customer intelligence and relationship management.</p>
        </div>
        <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> New Customer</Btn>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Contacts</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{customers.rows.filter((c) => c.type === 'contact').length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Accounts</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{customers.rows.filter((c) => c.type === 'account').length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Attributed pipeline</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{(deals.rows.filter((d) => d.stage !== 'lost').reduce((a, d) => a + d.value, 0)).toLocaleString()}</p></Card>
      </div>

      <Card>
        <CardHeader title="Relationship Intelligence" right={<Badge tone="purple">{customers.rows.length} customers</Badge>} />
        {customers.loading ? (
          <Spinner label="Loading customers..." />
        ) : customers.rows.length === 0 ? (
          <Empty title="No customers yet" hint="Create a contact or account to begin tracking relationships." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Customer</Th><Th>Type</Th><Th>Contact</Th><Th>Tags</Th><Th>Pipeline</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {customers.rows.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <Td><span className="flex items-center gap-2 font-medium text-gray-100"><Heart className="h-3.5 w-3.5 text-amber-300" />{c.name}</span></Td>
                  <Td><Badge tone={c.type === 'account' ? 'blue' : 'gray'}>{c.type}</Badge></Td>
                  <Td>{c.email ?? '—'}</Td>
                  <Td>{c.tags.length ? c.tags.map((tg) => <Badge key={tg} tone="purple">{tg}</Badge>) : '—'}</Td>
                  <Td>{(pipelineFor(c.id)).toLocaleString()}</Td>
                  <Td className="text-right"><Btn small kind="danger" onClick={() => remove(c.id)}><Trash2 className="h-3 w-3" /></Btn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title="New Customer">
        <div className="space-y-3">
          <Field label="Name"><Input value={cName} onChange={setCName} placeholder="Full name or company" /></Field>
          <Field label="Type">
            <Select value={cType} onChange={setCType} options={[{ value: 'contact', label: 'Contact' }, { value: 'account', label: 'Account' }]} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input value={cEmail} onChange={setCEmail} placeholder="you@example.com" /></Field>
            <Field label="Company"><Input value={cCompany} onChange={setCCompany} placeholder="Company (optional)" /></Field>
          </div>
          <Field label="Tags"><Input value={cTags} onChange={setCTags} placeholder="comma, separated, tags" /></Field>
          <Btn onClick={create} disabled={busy || !cName.trim()}>Save customer</Btn>
        </div>
      </Modal>
    </div>
  );
}