'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Empty, Spinner, Modal, Th, Td, money } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Deal {
  id: string; name: string; customerId?: string; value: number; stage: string; expectedClose?: string; updatedAt: string;
}

const STAGES = ['lead', 'qualified', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];
const stageTone = (s: string) => (s === 'won' ? 'green' : s === 'lost' ? 'gray' : s === 'lead' ? 'blue' : 'amber') as 'green' | 'gray' | 'blue' | 'amber';

export default function SalesPage() {
  const deals = useCollection<Deal>('deals', {});
  const customers = useCollection<{ id: string; name: string }>('customers', {});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dName, setDName] = useState('');
  const [dValue, setDValue] = useState('0');
  const [dCustomer, setDCustomer] = useState('');
  const [dStage, setDStage] = useState('lead');

  const open = deals.rows.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((a, d) => a + d.value, 0);
  const won = deals.rows.filter((d) => d.stage === 'won').reduce((a, d) => a + d.value, 0);

  const create = async () => {
    if (!dName.trim()) return;
    setBusy(true);
    try {
      await collection.create('deals', { name: dName, value: Number(dValue) || 0, customerId: dCustomer || undefined, stage: dStage });
      setShow(false); setDName(''); setDValue('0'); setDCustomer(''); setDStage('lead');
      deals.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const move = async (id: string, stage: string) => {
    try {
      await collection.update('deals', id, { stage });
      deals.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this deal?')) return;
    try {
      await collection.remove('deals', id);
      deals.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const customerName = (id?: string) => customers.rows.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Sales</h1>
          <p className="text-xs text-gray-500 mt-0.5">Deal pipeline and sales execution.</p>
        </div>
        <Btn onClick={() => setShow(true)}><Plus className="h-3.5 w-3.5" /> New Deal</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Open pipeline</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{money(open)}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Won to date</p><p className="mt-1.5 text-2xl font-bold text-emerald-400">{money(won)}</p></Card>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {STAGES.map((st) => (
          <Card key={st} className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">{st}</p>
              <Badge tone={stageTone(st)}>{deals.rows.filter((d) => d.stage === st).length}</Badge>
            </div>
            <p className="mt-1 text-sm font-bold text-gray-100">{money(deals.rows.filter((d) => d.stage === st).reduce((a, d) => a + d.value, 0))}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Deal Pipeline" right={<Badge tone="purple">{deals.rows.length} deals</Badge>} />
        {deals.loading ? (
          <Spinner label="Loading pipeline..." />
        ) : deals.rows.length === 0 ? (
          <Empty title="No deals yet" hint="Create a deal to build your sales pipeline." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Deal</Th><Th>Customer</Th><Th>Value</Th><Th>Stage</Th><Th className="text-right">Advance</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {deals.rows.map((d) => {
                const idx = STAGES.indexOf(d.stage);
                return (
                  <tr key={d.id} className="border-t border-white/5">
                    <Td><span className="font-medium text-gray-100">{d.name}</span></Td>
                    <Td>{customerName(d.customerId)}</Td>
                    <Td>{money(d.value)}</Td>
                    <Td><Badge tone={stageTone(d.stage)}>{d.stage}</Badge></Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {idx > 0 && <Btn small kind="ghost" onClick={() => move(d.id, STAGES[idx - 1])}>◀</Btn>}
                        {idx < STAGES.length - 1 && <Btn small kind="ghost" onClick={() => move(d.id, STAGES[idx + 1])}>▶</Btn>}
                      </div>
                    </Td>
                    <Td className="text-right"><Btn small kind="danger" onClick={() => remove(d.id)}><Trash2 className="h-3 w-3" /></Btn></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title="New Deal">
        <div className="space-y-3">
          <Field label="Deal name"><Input value={dName} onChange={setDName} placeholder="Opportunity name" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Value (USD)"><Input type="number" value={dValue} onChange={setDValue} /></Field>
            <Field label="Stage">
              <Select value={dStage} onChange={setDStage} options={STAGES.map((s) => ({ value: s, label: s }))} />
            </Field>
          </div>
          <Field label="Customer">
            <Select value={dCustomer} onChange={setDCustomer} options={[{ value: '', label: 'Unassigned' }, ...customers.rows.map((c) => ({ value: c.id, label: c.name }))]} />
          </Field>
          <Btn onClick={create} disabled={busy || !dName.trim()}>Create deal</Btn>
        </div>
      </Modal>
    </div>
  );
}