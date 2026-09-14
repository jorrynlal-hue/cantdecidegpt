'use client';

import { Card, CardHeader, Badge, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Task {
  id: string; title: string; status: string; priority: string; dueDate?: string;
}
interface Approval {
  id: string; title: string; status: string; requestedAt?: string;
}
interface Email {
  id: string; subject: string; status: string;
}

const prioRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const prioTone = (p: string): 'red' | 'amber' | 'blue' | 'gray' => (p === 'urgent' ? 'red' : p === 'high' ? 'amber' : p === 'low' ? 'blue' : 'gray');

export default function RescueButtonPage() {
  const tasks = useCollection<Task>('tasks');
  const approvals = useCollection<Approval>('approvals');
  const emails = useCollection<Email>('emails');

  const open = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status));
  const rescue = [...open].sort((a, b) => (prioRank[a.priority] ?? 3) - (prioRank[b.priority] ?? 3)).slice(0, 5);
  const pendingApprovals = approvals.rows.filter((a) => a.status === 'pending');
  const drafts = emails.rows.filter((e) => e.status === 'draft');

  const context = `Open tasks (${open.length}):\n${rescue.map((t) => `- ${t.title} [${t.priority}]${t.dueDate ? ` due ${t.dueDate}` : ''}`).join('\n')}\n\nPending approvals: ${pendingApprovals.length}\nEmail drafts waiting: ${drafts.length}\n\nName the top 3 actions that actually matter right now.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Rescue Button</h1>
        <p className="text-xs text-gray-500 mt-0.5">One tap. Everything waiting on you, in priority order.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Open tasks" value={open.length} tone="warn" />
        <Stat label="Pending approvals" value={pendingApprovals.length} tone="accent" />
        <Stat label="Email drafts" value={drafts.length} />
      </div>

      <Card>
        <CardHeader title="The Rescue Stack" right={<Badge tone={open.length || pendingApprovals.length ? 'amber' : 'green'}>{open.length || pendingApprovals.length ? 'needs you' : 'clear'}</Badge>} />
        {tasks.loading || approvals.loading ? (
          <Spinner label="Sweeping the workspace..." />
        ) : rescue.length === 0 && pendingApprovals.length === 0 ? (
          <Empty title="You are clear" hint="Nothing urgent is waiting. Enjoy it." />
        ) : (
          <ul className="divide-y divide-white/5">
            {rescue.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-xs font-medium text-gray-100">{t.title}</span>
                <Badge tone={prioTone(t.priority)}>{t.priority}</Badge>
              </li>
            ))}
            {pendingApprovals.map((a) => (
              <li key={`a-${a.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-xs font-medium text-gray-100">{a.title}</span>
                <Badge tone="purple">approval</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="rescuebutton"
        title="Triage"
        sub="Given the stack above, tell me what to do first — and how."
        placeholder="e.g. Save me: pick the top 3 things and give me the fastest path through each."
        examples={['Save me: top 3 actions right now', 'Which task is making everything else worse?', 'Give me a 20-minute triage plan']}
        context={context}
        prompt={(input, ctx) =>
          `You are the Rescue Button for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nAnswer with leadership: the top 3 actions in order, why, the fastest path for each, and what can safely wait a day.`
        }
        saveTitle={(input) => `Rescue triage — ${input.slice(0, 48)}`}
      />
    </div>
  );
}