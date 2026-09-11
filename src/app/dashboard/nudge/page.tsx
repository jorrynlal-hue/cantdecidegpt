'use client';

import { Card, CardHeader, Badge, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Task { id: string; title: string; status: string; priority: string; dueDate?: string; }

const prioRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function NudgePage() {
  const tasks = useCollection<Task>('tasks');
  const recurring = tasks.rows
    .filter((t) => !['completed', 'cancelled'].includes(t.status))
    .sort((a, b) => (prioRank[a.priority] ?? 3) - (prioRank[b.priority] ?? 3))
    .slice(0, 6);

  const context = `The thing you keep skipping:\n${recurring.map((t, i) => `${i + 1}. ${t.title} [${t.priority}]${t.dueDate ? ` due ${t.dueDate}` : ''}`).join('\n') || '  nothing pending'}\n\nGive one gentle, specific nudge to get the top item moving.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Nudge</h1>
        <p className="text-xs text-gray-500 mt-0.5">Gentle pushes on the thing you keep skipping.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Waiting on you" value={recurring.length} tone="warn" />
        <Stat label="Mode" value={'gentle'} tone="good" />
        <Stat label="Ear next" value={'now'} />
      </div>

      <Card>
        <CardHeader title="The Skipped List" right={<Badge tone="amber">{recurring.length} items</Badge>} />
        {tasks.loading ? (
          <Spinner label="Finding the skipped..." />
        ) : recurring.length === 0 ? (
          <Empty title="Nothing skipped" hint="Open tasks will appear here for gentle nudging." />
        ) : (
          <ul className="divide-y divide-white/5">
            {recurring.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="font-medium text-gray-100">{t.title}</span>
                <Badge tone="gray">{t.priority}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="nudge"
        title="The Nudge"
        sub="One kind nudge that makes the top item feel easy."
        placeholder="e.g. Nudge me toward the top item — kindly."
        examples={['Give me the one nudge that matters', 'Say it gently but make it clear', 'What is the smallest step I can take right now?']}
        context={context}
        prompt={(input, ctx) =>
          `You are Nudge for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nGive one gentle nudge: name the top item, give the smallest possible first step, and one honest reassurance. Short and kind.`
        }
        saveTitle={(input) => `Nudge — ${input.slice(0, 48)}`}
      />
    </div>
  );
}