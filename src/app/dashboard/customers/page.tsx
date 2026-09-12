'use client';

import { useState } from 'react';
import { Building2, HeartHandshake, Mail, Plus, Trash2, User, Phone } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Textarea, Empty, Spinner, Modal, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Customer { id: string; type: string; name: string; email?: string; phone?: string; company?: string; notes?: string; tags: string[]; createdAt: string; }
interface Deal { id: string; customerId?: string; stage: string; value?: number; }

const CUSTOMER_TYPES = [
  { label: 'Contact', value: 'contact' },
  { label: 'Company', value: 'company' },
];

export default function CustomersPage() {
  const customers = useCollection<Customer>('customers', {});
  const deals = useCollection<Deal>('deals', {});
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('all');
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [busy, setBusy] = useState(false);

  const allTags = [...new Set(customers.rows.flatMap((c) => c.tags ?? []))];
  const rows = customers.rows
    .filter((c) => (tag === 'all' ? true : (c.tags ?? []).includes(tag)))
    .filter((c) => (q ? (c.name + ' ' + (c.email ?? '') + ' ' + (c.company ?? '')).toLowerCase().includes(q.toLowerCase()) : true));

  const dealValue = (id: string) => deals.rows.filter((d) => d.customerId === id && d.stage === 'won').reduce((s, d) => s + (d.value ?? 0), 0);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await collection.create('customers', {
        type, name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined,
        company: company.trim() || undefined, notes: notes || undefined,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setName(''); setEmail(''); setPhone(''); setCompany(''); setNotes(''); setTagsInput(''); setType('contact');
      setOpen(false);
      customers.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Customer) => {
    if (!confirm(`Delete customer "${c.name}"?`)) return;
    try {
      await collection.remove('customers', c.id);
      customers.reload(); deals.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const companies = customers.rows.filter((c) => c.type === 'company').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Customers</h1>
          <p className="mt-0.5 text-xs text-gray-500">CRM and global customer map — health, risk, and relationships across the book of business.</p>
        </div>
        <Btn kind="solid" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add customer</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Book of business</p><p className="mt-1.5 text-2xl font-bold text-white">{customers.rows.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Contacts</p><p className="mt-1.5 text-2xl font-bold text-[#00D9B2]">{customers.rows.length - companies}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Companies</p><p className="mt-1.5 text-2xl font-bold text-[#438BFF]">{companies}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Tags</p><p className="mt-1.5 text-2xl font-bold text-amber-400">{allTags.length}</p></Card>
      </div>

      <Card>
        <CardHeader
          title="Customer map"
          right={
            <div className="flex items-center gap-2">
              <Input value={q} onChange={setQ} placeholder="Search customers" className="w-48" />
              <Select
                value={tag}
                onChange={setTag}
                className="w-28"
                options={[{ label: 'All tags', value: 'all' }, ...allTags.map((t) => ({ label: t, value: t }))]}
              />
            </div>
          }
        />
        {customers.loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty title={q || tag !== 'all' ? 'No customers match' : 'No customers yet'} hint="Add your first customer and the relationship engine will track health across deals, marketing and attribution." />
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00D9B2]/10 border border-[#00D9B2]/20">
                  {c.type === 'company' ? <Building2 className="h-4 w-4 text-[#00D9B2]" /> : <User className="h-4 w-4 text-[#00D9B2]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-gray-100">{c.name}</p>
                    {(c.tags ?? []).map((t) => <Badge key={t} tone="gray">{t}</Badge>)}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    <HeartHandshake className="mr-1 inline h-3 w-3 text-gray-600" />
                    added {fmtDate(c.createdAt)}
                    {c.email && <span className="ml-2 inline-flex items-center gap-1"><Mail className="h-3 w-3 text-gray-600" />{c.email}</span>}
                    {c.phone && <span className="ml-2 inline-flex items-center gap-1"><Phone className="h-3 w-3 text-gray-600" />{c.phone}</span>}
                    {dealValue(c.id) > 0 && <span className="ml-2 text-[#00D9B2]">· won <strong>${dealValue(c.id).toLocaleString()}</strong></span>}
                  </p>
                </div>
                <button type="button" onClick={() => remove(c)} className="p-1 text-gray-600 hover:text-rose-400" title="Delete customer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add customer">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={type} onChange={setType} options={CUSTOMER_TYPES} />
            </Field>
            <Field label="Name"><Input value={name} onChange={setName} placeholder="Name" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input value={email} onChange={setEmail} placeholder="name@example.com" /></Field>
            <Field label="Phone"><Input value={phone} onChange={setPhone} placeholder="+1 …" /></Field>
          </div>
          <Field label="Company"><Input value={company} onChange={setCompany} placeholder="Company (for contacts)" /></Field>
          <Field label="Tags"><Input value={tagsInput} onChange={setTagsInput} placeholder="hot, repeat, vip — comma separated" /></Field>
          <Field label="Notes"><Textarea value={notes} onChange={setNotes} rows={2} placeholder="Optional" /></Field>
          <Btn kind="solid" disabled={busy || !name.trim()} onClick={create} className="w-full">
            {busy ? 'Saving…' : 'Add customer'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}