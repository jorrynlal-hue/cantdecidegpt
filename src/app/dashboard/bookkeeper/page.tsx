'use client';

import { Card, CardHeader, Badge, Spinner, Stat, money } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Txn {
  id: string; type: 'income' | 'expense'; description: string; amount: number; categoryId?: string; date: string;
}

export default function BookkeeperPage() {
  const txns = useCollection<Txn>('transactions');

  const income = txns.rows.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = txns.rows.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const byCat = new Map<string, number>();
  txns.rows.filter((t) => t.type === 'expense').forEach((t) => {
    const key = t.categoryId ?? 'uncategorized';
    byCat.set(key, (byCat.get(key) ?? 0) + t.amount);
  });
  const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const context = `${txns.rows.length} transactions on record.\nIncome: ${money(income)}\nExpenses: ${money(expense)}\nNet: ${money(income - expense)}\nTop expense categories:\n${topCats.map(([c, a]) => `- ${c}: ${money(a)}`).join('\n') || '  none yet'}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Bookkeeper</h1>
        <p className="text-xs text-gray-500 mt-0.5">Plain-English bookkeeping summary over your live records.</p>
      </div>

      {txns.loading ? (
        <Spinner label="Loading books..." />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Income" value={money(income)} tone="good" />
          <Stat label="Expenses" value={money(expense)} tone="warn" />
          <Stat label="Net" value={money(income - expense)} tone="accent" />
        </div>
      )}

      <Card>
        <CardHeader title="Top expense areas" right={<Badge tone="purple">{byCat.size} categories</Badge>} />
        {txns.loading ? (
          <Spinner label="Reading categories..." />
        ) : topCats.length === 0 ? (
          <p className="p-4 text-xs text-gray-500">No expenses recorded yet. Add transactions in Finance.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {topCats.map(([c, a]) => (
              <li key={c} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="capitalize text-gray-300">{c}</span>
                <span className="font-semibold text-gray-100">{money(a)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="bookkeeper"
        title="The Books, Plain English"
        sub="Get a calm, jargon-free read of your financial position."
        placeholder="e.g. Summarize where the money went this period and what I should watch."
        examples={['Summarize my financial position in plain English', 'What is my biggest expense and is it a problem?', 'Write a simple monthly owner memo']}
        context={context}
        prompt={(input, ctx) =>
          `You are the Bookkeeper for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nExplain the books in plain, honest language: the numbers agree with what is shown, call out the one thing worth attention, and suggest one small improvement. No accounting jargon.`
        }
        saveTitle={(input) => `Books memo — ${input.slice(0, 48)}`}
        kind="reference"
      />
    </div>
  );
}