'use client';

import { Card, CardHeader, Badge, Empty, Spinner, Th, Td, Stat, fmtDate, money } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Deal {
  id: string; name: string; stage: string; value: number; expectedClose?: string;
}
interface Invoice {
  id: string; number: string; status: string; lines: { qty: number; price: number }[];
  taxPct: number; discountPct: number; dueDate?: string;
}

function invoiceTotal(inv: Invoice): number {
  const sub = inv.lines.reduce((a, l) => a + l.qty * l.price, 0);
  return sub * (1 + (inv.taxPct ?? 0) / 100) * (1 - (inv.discountPct ?? 0) / 100);
}

export default function CloserPage() {
  const deals = useCollection<Deal>('deals');
  const invoices = useCollection<Invoice>('invoices');

  const quals = deals.rows.filter((d) => ['proposal', 'negotiation'].includes(d.stage));
  const won = deals.rows.filter((d) => d.stage === 'won');
  const overdue = invoices.rows.filter((i) => i.status === 'overdue');
  const openValue = deals.rows.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((a, d) => a + (d.value || 0), 0);

  const context = `Open deals needing attention:\n${quals.map((d) => `- ${d.name} [${d.stage}] $${d.value || 0}${d.expectedClose ? ` closes ${fmtDate(d.expectedClose)}` : ''}`).join('\n') || '  none'}\n\nOverdue invoices:\n${overdue.map((i) => `- ${i.number} — ${money(invoiceTotal(i))}${i.dueDate ? ` due ${fmtDate(i.dueDate)}` : ''}`).join('\n') || '  none'}\n\nDraft a follow-up plan that keeps the door open without being pushy, and names the exact next message for each.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Closer</h1>
        <p className="text-xs text-gray-500 mt-0.5">Follow-ups that push deals and invoices over the line.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Open pipeline" value={money(openValue)} tone="good" />
        <Stat label="In negotiation" value={quals.length} tone="warn" />
        <Stat label="Won" value={won.length} />
      </div>

      <Card>
        <CardHeader title="Needs a nudge" right={<Badge tone="amber">{quals.length + overdue.length} items</Badge>} />
        {deals.loading || invoices.loading ? (
          <Spinner label="Loading pipeline..." />
        ) : quals.length === 0 && overdue.length === 0 ? (
          <Empty title="Nothing waiting" hint="Deals and invoices in motion will appear here." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Target</Th><Th>Stage</Th><Th>Amount</Th><Th>Due / close</Th></tr></thead>
            <tbody>
              {quals.map((d) => (
                <tr key={`d-${d.id}`} className="border-t border-white/5">
                  <Td><span className="font-medium text-gray-100">{d.name}</span></Td>
                  <Td><Badge tone={d.stage === 'negotiation' ? 'purple' : 'blue'}>{d.stage}</Badge></Td>
                  <Td>{money(d.value || 0)}</Td>
                  <Td>{fmtDate(d.expectedClose)}</Td>
                </tr>
              ))}
              {overdue.map((i) => (
                <tr key={`i-${i.id}`} className="border-t border-white/5">
                  <Td><span className="font-medium text-gray-100">{i.number}</span></Td>
                  <Td><Badge tone="red">overdue</Badge></Td>
                  <Td>{money(invoiceTotal(i))}</Td>
                  <Td>{fmtDate(i.dueDate)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <AIMemo
        toolId="closer"
        title="Follow-up Engine"
        sub="Generate the exact next message for each open deal and invoice."
        placeholder="e.g. Draft gentle but firm follow-ups for the overdue invoices and the two deals stuck in negotiation."
        examples={['Draft follow-ups for everything in the list', 'Write the next message for the most valuable open deal', 'Compose a win-back nudge for the overdue invoices']}
        context={context}
        prompt={(input, ctx) =>
          `You are the Closer for the Imprint operating system. ${ctx ?? ''}\n\nUser instruction: ${input}\n\nFor each target: a one-line status read, the exact next message (subject + body), and the send time. Warm, direct, never pushy.`
        }
        saveTitle={(input) => `Closer follow-ups — ${input.slice(0, 48)}`}
        kind="reference"
      />
    </div>
  );
}