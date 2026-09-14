'use client';

import { Card, CardHeader, Badge, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Task { id: string; title: string; status: string; priority: string; dueDate?: string; }
interface Deal { id: string; name: string; stage: string; value: number; }
interface Invoice { id: string; number: string; status: string; }

export default function WeeklyOpsPage() {
  const tasks = useCollection<Task>('tasks');
  const deals = useCollection<Deal>('deals');
  const invoices = useCollection<Invoice>('invoices');

  const open = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;
  const done = tasks.rows.filter((t) => t.status === 'completed').length;
  const pipeline = deals.rows.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((a, d) => a + (d.value || 0), 0);
  const overdue = invoices.rows.filter((i) => i.status === 'overdue').length;

  const context = `This week in the operating system:\n- Tasks: ${open} open, ${done} completed\n- Open pipeline value: $${pipeline}\n- Overdue invoices: ${overdue}\n\nWrite the Monday morning operating brief.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Weekly Ops</h1>
        <p className="text-xs text-gray-500 mt-0.5">The Monday morning read: what moved last week, what needs you this week.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Open tasks" value={open} tone="warn" />
        <Stat label="Completed" value={done} tone="good" />
        <Stat label="Pipeline" value={`$${pipeline}`} tone="accent" />
        <Stat label="Overdue" value={overdue} tone={overdue ? 'warn' : 'default'} />
      </div>

      <Card>
        <CardHeader title="Live signals" right={<Badge tone="purple">ops brief</Badge>} />
        {tasks.loading || deals.loading || invoices.loading ? (
          <Spinner label="Gathering signals..." />
        ) : (
          <Empty title="Signals loaded" hint="Generate the brief below — it uses these numbers." />
        )}
      </Card>

      <AIMemo
        toolId="weeklyops"
        title="Monday Brief"
        sub="A disciplined, short operating brief generated from live data."
        placeholder="e.g. Write this week's operating brief."
        examples={['Write the week’s operating brief', 'What is the one thing that must happen this week?', 'Turn these numbers into a 5-bullet brief']}
        context={context}
        prompt={(input, ctx) =>
          `You are Weekly Ops for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nWrite the Monday brief: a 3-sentence state of the system, the one thing that must happen, the two risks, and the focus for the week. No filler.`
        }
        saveTitle={() => `Weekly ops brief — ${new Date().toLocaleDateString()}`}
        kind="reference"
      />
    </div>
  );
}