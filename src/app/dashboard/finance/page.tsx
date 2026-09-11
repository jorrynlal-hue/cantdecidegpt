'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Select, Field, Empty, Spinner, Modal, Th, Td, fmtDate, money } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';

interface Txn { id: string; type: 'income' | 'expense'; description: string; amount: number; categoryId?: string; date: string; createdAt: string; }
interface Category { id: string; name: string; type: 'income' | 'expense'; }
interface Invoice { id: string; number: string; customerId?: string; status: string; date: string; dueDate?: string; taxPct: number; discountPct: number; lines: { description: string; quantity: number; unitPrice: number }[]; totals: { subtotal: number; tax: number; discount: number; total: number }; }
interface Customer { id: string; name: string; type: string; }

const invTone = (s: string) => (s === 'paid' ? 'green' : s === 'cancelled' ? 'gray' : s === 'overdue' ? 'red' : 'amber') as 'green' | 'gray' | 'red' | 'amber';

export default function FinancePage() {
  const [tab, setTab] = useState<'overview' | 'transactions' | 'invoices'>('overview');
  const txns = useCollection<Txn>('transactions', {});
  const cats = useCollection<Category>('txnCategories', {});
  const invs = useCollection<Invoice>('invoices', {});
  const customers = useCollection<Customer>('customers', {});

  const [showTxn, setShowTxn] = useState(false);
  const [tType, setTType] = useState<'income' | 'expense'>('expense');
  const [tDesc, setTDesc] = useState('');
  const [tAmount, setTAmount] = useState('');
  const [tCat, setTCat] = useState('');
  const [tDate, setTDate] = useState('');

  const [showInv, setShowInv] = useState(false);
  const [iCustomer, setICustomer] = useState('');
  const [iDue, setIDue] = useState('');
  const [iNotes, setINotes] = useState('');
  const [iLines, setILines] = useState<{ description: string; qty: string; price: string }[]>([{ description: '', qty: '1', price: '100' }]);
  const [iTax, setITax] = useState('10');

  const addTxn = async () => {
    if (!tDesc.trim() || !Number(tAmount)) return;
    try {
      await collection.create('transactions', { type: tType, description: tDesc, amount: Number(tAmount), categoryId: tCat || undefined, date: tDate || undefined });
      setShowTxn(false); setTDesc(''); setTAmount(''); setTCat(''); setTDate('');
      txns.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const addInvoice = async () => {
    try {
      const lines = iLines
        .filter((l) => l.description.trim())
        .map((l) => ({ description: l.description.trim(), qty: Number(l.qty) || 1, price: Number(l.price) || 0 }));
      if (!lines.length) {
        alert('Add at least one line with a description.');
        return;
      }
      await collection.create('invoices', { customerId: iCustomer || undefined, dueDate: iDue || undefined, notes: iNotes || undefined, lines, taxPct: Number(iTax) || 0 });
      setShowInv(false); setICustomer(''); setIDue(''); setINotes(''); setILines([{ description: '', qty: '1', price: '100' }]); setITax('10');
      invs.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const lineTotal = (l: { qty?: string; price?: string }) => (Number(l.qty) || 1) * (Number(l.price) || 0);
  const draftTotal = iLines.reduce((a, l) => a + lineTotal(l), 0);

  const setInvStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/db/invoices/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'status', status }),
      });
      invs.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const stats = useMemo(() => {
    const income = txns.rows.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = txns.rows.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const byCat: Record<string, { name: string; amount: number }> = {};
    txns.rows.filter((t) => t.type === 'expense').forEach((t) => {
      const name = cats.rows.find((c) => c.id === t.categoryId)?.name ?? 'uncategorized';
      byCat[name] = { name, amount: (byCat[name]?.amount ?? 0) + t.amount };
    });
    return { income, expense, net: income - expense, byCat: Object.values(byCat).sort((a, b) => b.amount - a.amount) };
  }, [txns.rows, cats.rows]);

  const catName = (id?: string) => cats.rows.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Finance</h1>
          <p className="text-xs text-gray-500 mt-0.5">Transactions with categories and invoices that move real money values.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['overview', 'transactions', 'invoices'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium capitalize ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          <Btn onClick={() => (tab === 'invoices' ? setShowInv(true) : setShowTxn(true))}>
            <Plus className="w-3.5 h-3.5" /> {tab === 'invoices' ? 'New invoice' : 'Add transaction'}
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><p className="text-[10px] uppercase tracking-wider text-gray-500">Income</p><p className="text-lg font-bold text-emerald-300">{money(stats.income)}</p></Card>
        <Card className="p-4 text-center"><p className="text-[10px] uppercase tracking-wider text-gray-500">Expense</p><p className="text-lg font-bold text-rose-300">{money(stats.expense)}</p></Card>
        <Card className="p-4 text-center"><p className="text-[10px] uppercase tracking-wider text-gray-500">Net</p><p className={`text-lg font-bold ${stats.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{money(stats.net)}</p></Card>
      </div>

      {tab === 'overview' && (
        <Card>
          <CardHeader title="Spending by category" sub="Real expense transactions" />
          <div className="p-4 space-y-2">
            {stats.byCat.length === 0 ? (
              <Empty title="No expenses yet" hint="Add a transaction to see the breakdown." />
            ) : stats.byCat.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-32 text-xs text-gray-400">{c.name}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${(c.amount / stats.expense) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-300 w-20 text-right">{money(c.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'transactions' && (
        <Card>
          {txns.loading ? <Spinner /> : txns.rows.length === 0 ? (
            <Empty title="No transactions yet" hint="Record income or an expense." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/5"><tr><Th>Description</Th><Th>Type</Th><Th>Category</Th><Th>Date</Th><Th>Amount</Th><Th></Th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {txns.rows.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5">
                      <Td className="font-medium text-white">{t.description}</Td>
                      <Td><Badge tone={t.type === 'income' ? 'green' : 'amber'}>{t.type}</Badge></Td>
                      <Td>{catName(t.categoryId)}</Td>
                      <Td className="text-xs">{fmtDate(t.date)}</Td>
                      <Td className={`font-medium ${t.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</Td>
                      <Td><button onClick={async () => { await collection.remove('transactions', t.id); txns.reload(); }} className="p-1 rounded text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'invoices' && (
        <Card>
          {invs.loading ? <Spinner /> : invs.rows.length === 0 ? (
            <Empty title="No invoices yet" hint="Create an invoice to start billing." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/5"><tr><Th>Number</Th><Th>Customer</Th><Th>Total</Th><Th>Due</Th><Th>Status</Th><Th></Th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {invs.rows.map((i) => (
                    <tr key={i.id} className="hover:bg-white/5">
                      <Td className="font-medium text-white">{i.number}</Td>
                      <Td className="text-xs">{customers.rows.find((c) => c.id === i.customerId)?.name ?? '—'}</Td>
                      <Td className="font-medium text-purple-300">{money(i.totals.total)}</Td>
                      <Td className="text-xs">{fmtDate(i.dueDate)}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Badge tone={invTone(i.status)}>{i.status}</Badge>
                          {(i.status === 'sent' || i.status === 'draft') && i.totals.total > 0 ? (
                            <Btn kind="outline" small onClick={() => setInvStatus(i.id, 'paid')}><Send className="w-3 h-3" /> Mark paid</Btn>
                          ) : null}
                        </div>
                      </Td>
                      <Td><button onClick={async () => { await collection.remove('invoices', i.id); invs.reload(); }} className="p-1 rounded text-gray-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal open={showTxn} onClose={() => setShowTxn(false)} title="Add transaction">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type"><Select value={tType} onChange={(v) => setTType(v as 'income' | 'expense')} options={[{ label: 'Expense', value: 'expense' }, { label: 'Income', value: 'income' }]} /></Field>
            <Field label="Amount"><Input value={tAmount} onChange={setTAmount} type="number" placeholder="0" /></Field>
          </div>
          <Field label="Description"><Input value={tDesc} onChange={setTDesc} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><Select value={tCat} onChange={setTCat} options={[{ label: 'None', value: '' }, ...cats.rows.filter((c) => c.type === tType).map((c) => ({ label: c.name, value: c.id }))]} /></Field>
            <Field label="Date"><Input value={tDate} onChange={setTDate} type="date" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setShowTxn(false)}>Cancel</Btn>
            <Btn onClick={addTxn} disabled={!tDesc.trim() || !Number(tAmount)}>Record</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={showInv} onClose={() => setShowInv(false)} title="Create invoice">
        <div className="space-y-3">
          <Field label="Customer"><Select value={iCustomer} onChange={setICustomer} options={[{ label: 'None (walk-in)', value: '' }, ...customers.rows.map((c) => ({ label: c.name, value: c.id }))]} /></Field>
          <Field label="Due date"><Input value={iDue} onChange={setIDue} type="date" /></Field>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider text-gray-500">Lines</span>
              <Btn kind="ghost" small onClick={() => setILines((ls) => [...ls, { description: '', qty: '1', price: '0' }])}>+ Add line</Btn>
            </div>
            <div className="space-y-2">
              {iLines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_64px_90px_28px] gap-2 items-center">
                  <Input value={l.description} onChange={(v) => setILines((ls) => ls.map((x, j) => (j === idx ? { ...x, description: v } : x)))} placeholder="Description" />
                  <Input value={l.qty} onChange={(v) => setILines((ls) => ls.map((x, j) => (j === idx ? { ...x, qty: v } : x)))} type="number" />
                  <Input value={l.price} onChange={(v) => setILines((ls) => ls.map((x, j) => (j === idx ? { ...x, price: v } : x)))} type="number" />
                  <button onClick={() => setILines((ls) => ls.filter((_, j) => j !== idx))} className="text-gray-600 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-right text-xs text-gray-500">Subtotal {money(draftTotal)}</p>
          </div>
          <Field label="Tax %"><Input value={iTax} onChange={setITax} type="number" /></Field>
          <Field label="Notes"><Textarea value={iNotes} onChange={setINotes} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn kind="ghost" onClick={() => setShowInv(false)}>Cancel</Btn>
            <Btn onClick={addInvoice}>Create</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}