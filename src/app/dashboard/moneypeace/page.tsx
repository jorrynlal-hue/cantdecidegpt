'use client';

import { Card, CardHeader, Badge, Spinner, Stat, money } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Txn { id: string; type: 'income' | 'expense'; description: string; amount: number; }

export default function MoneyPeacePage() {
  const txns = useCollection<Txn>('transactions');
  const income = txns.rows.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = txns.rows.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  const context = `Money on this system:\n- ${txns.rows.length} transactions\n- Income: ${money(income)}\n- Spent: ${money(expense)}\n- Net: ${money(income - expense)}\n\nTalk about money the way a calm, trustworthy friend would — no panic, no jargon.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Money Peace</h1>
        <p className="text-xs text-gray-500 mt-0.5">Your finances explained in plain, calm language. No jargon.</p>
      </div>

      {txns.loading ? (
        <Spinner label="Opening the books..." />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Coming in" value={money(income)} tone="good" />
          <Stat label="Going out" value={money(expense)} tone="warn" />
          <Stat label="Net" value={money(income - expense)} tone="accent" />
        </div>
      )}

      <Card>
        <CardHeader title="Reality check" right={<Badge tone={income >= expense ? 'green' : 'amber'}>{income >= expense ? 'breathing room' : 'watch the burn'}</Badge>} />
        <p className="p-4 text-xs leading-relaxed text-gray-400">
          {txns.loading
            ? 'Faithfully counting to make sure the numbers are honest before we talk about them.'
            : `${income >= expense ? 'You are living inside your income — that is the whole game.' : 'Spending is running ahead of income. It is not a verdict, it is a signal — and signals can be read calmly.'}`}
        </p>
      </Card>

      <AIMemo
        toolId="moneypeace"
        title="Money, Simply"
        sub="Ask anything about your money in plain words."
        placeholder="e.g. Am I okay? Just tell me where I stand, simply."
        examples={['Where do I stand, simply?', 'What is quietly eating my budget?', 'Say something reassuring that is still true']}
        context={context}
        prompt={(input, ctx) =>
          `You are Money Peace for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nAnswer with calm, plain, honest clarity: the real number, the real concern, the one next step. Kind but never patronizing, never alarmist.`
        }
        saveTitle={(input) => `Money peace — ${input.slice(0, 48)}`}
      />
    </div>
  );
}