'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Badge, Btn, Input, Textarea, Select, Field, Empty, Spinner, Modal, Th, Td, fmtDate, money } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Customer { id: string; type: string; name: string; email?: string; phone?: string; company?: string; notes?: string; tags: string[]; updatedAt: string; }
interface Deal { id: string; name: string; customerId?: string; value: number; stage: string; expectedClose?: string; updatedAt: string; }

const stageTone = (s: string) => (s === 'won' ? 'green' : s === 'lost' ? 'gray' : s === 'lead' ? 'blue' : 'amber') as 'green' | 'gray' | 'blue' | 'amber';

export default function CrmPage() {
  const [tab, setTab] = useState<'customers' | 'deals'>('customers');
  const customers = useCollection<Customer>('customers', {});
  const deals = useCollection<Deal>('deals', {});
  const [show, setShow] = useState(false);

  const [cName, setCName] = useState('');
  const [cType, setCType] = useState('contact');
  const [cEmail, setCEmail] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cTags, setCTags] = useState('');

  const [dName, setDName] = useState('');
  const [dValue, setDValue] = useState('0');
  const [dCustomer, setDCustomer] = useState('');
  const [dStage, setDStage] = useState('lead');

  const create = async () => {
    setShow(false);
    try {
      if (tab === 'customers') {
        await collection.create('customers', {
          name: cName, type: cType, email: cEmail || undefined, company: cCompany || undefined,
          tags: cTags.split(',').map((t) => t.trim()).filter(Boolean),
        });
        setCName(''); setCType('contact'); setCEmail(''); setCCompany(''); setCTags('');
        customers.reload();
      } else {
        await collection.create('deals', {
          name: dName, value: Number(dValue) || 0, customerId: dCustomer || undefined,
          stage: dStage, expectedClose: undefined,
        });
        setDName(''); setDValue('0'); setDCustomer(''); setDStage('lead');
        deals.reload();
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const moveDeal = async (id: string, stage: string) => {
    try {
      await collection.update('deals', id, { stage });
      deals.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      if (tab === 'customers') await collection.remove('customers', id);
      else await collection.remove('deals', id);
      (tab === 'customers' ? customers : deals).reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const pipeline = ['lead', 'qualified', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];
  const customerName = (id?: string) => customers.rows.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">CRM & Sales</h1>
          <p className="text-xs text-gray-500 mt-0.5">Customers and a real pipeline derived from your deals.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['customers', 'deals'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t === 'customers' ? 'Customers' : 'Deals'}
              </button>
            ))}
          </div>
          <Btn onClick={() => setShow(true)}><Plus className="w-3.5 h-3.5" /> {tab === 'customers' ? 'Add customer' : 'Add deal'}</Btn>
        </div>
      </div>

      {tab === 'deals' && !deals.loading && (
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Pipeline</p>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {pipeline.map((st) => {
              const items = deals.rows.filter((d) => d.stage === st);
              const total = items.reduce((a, d) => a + d.value, 0);
              return (
                <div key={st} className="rounded-lg border border-white/8 bg-[#0b0b12] p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">{st}</p>
                  <p className="text-sm font-bold text-white">{items.length}</p>
                  <p className="text-[10px] text-gray-600">{money(total)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        {tab === 'customers' && (customers.loading ? <Spinner /> : customers.rows.length === 0 ? (
          <Empty title="No customers yet" hint="Add a customer or ask the AI assistant to create one." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/5"><tr><Th>Name</Th><Th>Type</Th><Th>Email</Th><Th>Company</Th><Th>Tags</Th><Th>Updated</Th><Th></Th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {customers.rows.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <Td className="font-medium text-white">{c.name}</Td>
                    <Td><Badge tone={c.type === 'company' ? 'blue' : 'gray'}>{c.type}</Badge></Td>
                    <Td className="text-xs">{c.email ?? '—'}</Td>
                    <Td>{c.company ?? '—'}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">{c.tags.map((t) => <Badge key={t} tone="purple">{t}</Badge>)}</div>
                    </Td>
                    <Td className="text-xs text-gray-500">{fmtDate(c.updatedAt)}</Td>
                    <Td><button onClick={() => del(c.id)} className="p-1 rounded-md text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {tab === 'deals' && (deals.loading ? <Spinner /> : deals.rows.length === 0 ? (
          <Empty title="No deals yet" hint="Create a deal to grow your pipeline." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/5"><tr><Th>Deal</Th><Th>Customer</Th><Th>Value</Th><Th>Stage</Th><Th>Expected close</Th><Th>Move</Th><Th></Th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {deals.rows.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5">
                    <Td className="font-medium text-white">{d.name}</Td>
                    <Td className="text-xs">{customerName(d.customerId)}</Td>
                    <Td className="font-medium text-purple-300">{money(d.value)}</Td>
                    <Td><Badge tone={stageTone(d.stage)}>{d.stage}</Badge></Td>
                    <Td className="text-xs">{fmtDate(d.expectedClose)}</Td>
                    <Td>
                      <select
                        value={d.stage}
                        onChange={(e) => moveDeal(d.id, e.target.value)}
                        className="rounded border border-white/10 bg-[#0b0b12] text-xs text-white px-1.5 py-1"
                      >
                        {pipeline.map((s) => <option key={s} value={s} className="bg-[#0b0b12]">{s}</option>)}
                      </select>
                    </Td>
                    <Td><button onClick={() => del(d.id)} className="p-1 rounded-md text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title={tab === 'customers' ? 'Add customer' : 'Add deal'}>
        <div className="space-y-3">
          {tab === 'customers' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name"><Input value={cName} onChange={setCName} /></Field>
                <Field label="Type"><Select value={cType} onChange={setCType} options={[{ label: 'Contact', value: 'contact' }, { label: 'Company', value: 'company' }]} /></Field>
              </div>
              <Field label="Email"><Input value={cEmail} onChange={setCEmail} /></Field>
              <Field label="Company"><Input value={cCompany} onChange={setCCompany} /></Field>
              <Field label="Tags (comma separated)"><Input value={cTags} onChange={setCTags} placeholder="hot, vip" /></Field>
            </>
          ) : (
            <>
              <Field label="Deal name"><Input value={dName} onChange={setDName} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Value"><Input value={dValue} onChange={setDValue} type="number" /></Field>
                <Field label="Stage"><Select value={dStage} onChange={setDStage} options={pipeline.map((s) => ({ label: s, value: s }))} /></Field>
              </div>
              <Field label="Customer"><Select value={dCustomer} onChange={setDCustomer} options={[{ label: 'None', value: '' }, ...customers.rows.map((c) => ({ label: c.name, value: c.id }))]} /></Field>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setShow(false)}>Cancel</Btn>
            <Btn onClick={create} disabled={(tab === 'customers' ? !cName.trim() : !dName.trim())}>Create</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}