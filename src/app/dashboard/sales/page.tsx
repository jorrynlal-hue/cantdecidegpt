'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Target, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Select, Field, Empty, Spinner, Modal, money } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Deal { id: string; name: string; customerId?: string; value?: number; stage: string; expectedClose?: string; notes?: string; createdAt: string; }
interface Customer { id: string; name: string; }

const PIPELINE = ['lead', 'qualified', 'contacted', 'proposal', 'negotiation'];
const STAGES = [...PIPELINE, 'won', 'lost'];
const WEIGHT: Record<string, number> = { lead: 0.1, qualified: 0.3, contacted: 0.45, proposal: 0.65, negotiation: 0.85, won: 1, lost: 0 };

export default function SalesPage() {
  const deals = useCollection<Deal>('deals', {});
  const customers = useCollection<Customer>('customers', {});
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState('lead');
  const [expectedClose, setExpectedClose] = useState('');
  const [busy, setBusy] = useState(false);

  const won = deals.rows.filter((d) => d.stage === 'won');
  const openDeals = deals.rows.filter((d) => !['won', 'lost'].includes(d.stage));
  const pipelineValue = openDeals.reduce((s, d) => s + (d.value ?? 0) * (WEIGHT[d.stage] ?? 0), 0);
  const wonValue = won.reduce((s, d) => s + (d.value ?? 0), 0);
  const winRate = won.length + deals.rows.filter((d) => d.stage === 'lost').length > 0
    ? Math.round((won.length / (won.length + deals.rows.filter((d) => d.stage === 'lost').length)) * 100)
    : 0;
  const customerName = (id?: string) => customers.rows.find((c) => c.id === id)?.name ?? '—';

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await collection.create('deals', {
        name: name.trim(), customerId: customerId || undefined,
        value: Number(value) || 0, stage, expectedClose: expectedClose || undefined,
      });
      setName(''); setCustomerId(''); setValue(''); setStage('lead'); setExpectedClose('');
      setOpen(false);
      deals.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const move = async (d: Deal, dir: 1 | -1) => {
    const idx = STAGES.indexOf(d.stage);
    const next = STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))];
    if (next === d.stage) return;
    try {
      await collection.update('deals', d.id, { stage: next });
      deals.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const remove = async (d: Deal) => {
    if (!confirm(`Delete deal "${d.name}"?`)) return;
    try {
      await collection.remove('deals', d.id);
      deals.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Sales</h1>
          <p className="mt-0.5 text-xs text-gray-500">Pipeline, forecast, and revenue — deals tracked automatically against customers and attribution.</p>
        </div>
        <Btn kind="solid" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New deal</Btn>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Open pipeline</p><p className="mt-1.5 text-2xl font-bold text-white">{openDeals.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Weighted forecast</p><p className="mt-1.5 text-2xl font-bold text-[#00D9B2]">{money(pipelineValue)}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Won revenue</p><p className="mt-1.5 text-2xl font-bold text-emerald-400">{money(wonValue)}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Win rate</p><p className="mt-1.5 text-2xl font-bold text-[#438BFF]">{winRate}%</p></Card>
      </div>

      <Card>
        <CardHeader
          title="Deal pipeline"
          right={
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00D9B2]" />
              <Badge tone="green">{deals.rows.length} deals</Badge>
            </div>
          }
        />
        {deals.loading ? (
          <Spinner />
        ) : deals.rows.length === 0 ? (
          <Empty title="No deals yet" hint="Add a deal to start the revenue pipeline. It ties live to Customers, Attribution and Reports on the radial board." />
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3 lg:grid-cols-5">
            {PIPELINE.map((s) => {
              const bucket = deals.rows.filter((d) => d.stage === s);
              const sum = bucket.reduce((a, d) => a + (d.value ?? 0), 0);
              return (
                <div key={s} className="rounded-xl bg-white/[0.02] border border-white/5 p-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s}</p>
                    <span className="text-[10px] font-semibold text-gray-500">{sum > 0 ? money(sum) : ''}</span>
                  </div>
                  <div className="mt-1.5 space-y-1.5">
                    {bucket.length === 0 && <p className="px-1 text-[10px] text-gray-700">empty</p>}
                    {bucket.map((d) => (
                      <div key={d.id} className="rounded-lg border border-white/5 bg-[#202630] p-2">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-semibold text-gray-100">{d.name}</p>
                          <span className="text-[10px] font-bold text-[#00D9B2]">{(d.value ?? 0) > 0 ? money(d.value ?? 0) : '—'}</span>
                        </div>
                        <p className="truncate text-[10px] text-gray-500">{customerName(d.customerId)}{d.expectedClose ? ` · ${d.expectedClose}` : ''}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <button type="button" onClick={() => move(d, -1)} className="rounded p-0.5 text-gray-600 hover:bg-white/5 hover:text-white" disabled={s === 'lead'}><ChevronLeft className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => move(d, 1)} className="rounded p-0.5 text-gray-600 hover:bg-white/5 hover:text-white" title="Advance stage"><ChevronRight className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => remove(d)} className="ml-auto rounded p-0.5 text-gray-600 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {won.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/5 px-3 py-2">
            {won.map((d) => (
              <Badge key={d.id} tone="green"><CheckIcon /> {d.name} — {money(d.value ?? 0)}</Badge>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New deal">
        <div className="space-y-3">
          <Field label="Deal name"><Input value={name} onChange={setName} placeholder="Deal name" /></Field>
          <Field label="Customer">
            <Select
              value={customerId}
              onChange={setCustomerId}
              options={[{ label: 'No customer (optional)', value: '' }, ...customers.rows.map((c) => ({ label: c.name, value: c.id }))]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Value (USD)"><Input value={value} onChange={setValue} type="number" placeholder="1000" /></Field>
            <Field label="Stage">
              <Select value={stage} onChange={setStage} options={STAGES.map((s) => ({ label: s, value: s }))} />
            </Field>
          </div>
          <Field label="Expected close"><Input value={expectedClose} onChange={setExpectedClose} type="date" /></Field>
          <Btn kind="solid" disabled={busy || !name.trim()} onClick={create} className="w-full">
            {busy ? 'Saving…' : 'Create deal'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

function CheckIcon() {
  return <Target className="h-3 w-3" />;
}