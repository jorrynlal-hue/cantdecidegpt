'use client';

import { Card, CardHeader, Badge, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Customer {
  id: string; name: string; type: string; updatedAt: string; createdAt: string;
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const daysSince = (iso: string) => Math.floor((NOW - new Date(iso).getTime()) / DAY);

export default function DecayDetectPage() {
  const customers = useCollection<Customer>('customers');
  const cold = customers.rows.filter((c) => daysSince(c.updatedAt) > 30);
  const recentlyActive = customers.rows.filter((c) => daysSince(c.updatedAt) <= 14);

  const context = `${customers.rows.length} customers on record.\nGoing cold (no touch in 30+ days):\n${cold.slice(0, 10).map((c) => `- ${c.name} (${c.type}) last touch ${daysSince(c.updatedAt)} days ago`).join('\n') || '  none'}\nRecently active (≤14d): ${recentlyActive.length}\n\nFlag the relationships at real risk and give the first touch for each.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Decay Detect</h1>
        <p className="text-xs text-gray-500 mt-0.5">Flags relationships going cold before they vanish.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Customers" value={customers.rows.length} />
        <Stat label="Going cold" value={cold.length} tone={cold.length ? 'warn' : 'good'} />
        <Stat label="Recently active" value={recentlyActive.length} tone="good" />
      </div>

      <Card>
        <CardHeader title="Cold watch" right={<Badge tone={cold.length ? 'amber' : 'green'}>{cold.length} at risk</Badge>} />
        {customers.loading ? (
          <Spinner label="Checking relationships..." />
        ) : cold.length === 0 ? (
          <Empty title="Nothing going cold" hint="Customers who go quiet for 30+ days will appear here." />
        ) : (
          <ul className="divide-y divide-white/5">
            {cold.slice(0, 10).map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="font-medium text-gray-100">{c.name}</span>
                <Badge tone="amber">{daysSince(c.updatedAt)}d since touch</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="decaydetect"
        title="Warm-up Plan"
        sub="Recommended first touch for each relationship at risk."
        placeholder="e.g. Give me the first touch for everyone going cold."
        examples={['Give the first touch for everyone going cold', 'How do I restart a 40-day silence without feeling awkward?', 'Rank the relationships by salvage value']}
        context={context}
        prompt={(input, ctx) =>
          `You are Decay Detect for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nFor each flagged relationship: why it matters, the exact first touch (subject + 2 lines), and the follow-up if they reply. Understated, specific, not salesy.`
        }
        saveTitle={(input) => `Decay warm-up — ${input.slice(0, 48)}`}
      />
    </div>
  );
}