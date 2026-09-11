'use client';

import { Card, CardHeader, Badge, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Task { id: string; title: string; status: string; }
interface Deal { id: string; name: string; stage: string; value: number; }
interface Email { id: string; subject: string; status: string; }

export default function ShadowFounderPage() {
  const tasks = useCollection<Task>('tasks');
  const deals = useCollection<Deal>('deals');
  const emails = useCollection<Email>('emails');

  const done = tasks.rows.filter((t) => t.status === 'completed').length;
  const openValue = deals.rows.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((a, d) => a + (d.value || 0), 0);
  const drafts = emails.rows.filter((e) => e.status === 'draft').length;

  const context = `End of day:\n- Tasks completed today: ${done}\n- Open pipeline value: $${openValue}\n- Email drafts waiting: ${drafts}\n\nWrite the night memo a founder would leave for tomorrow's self — honest about what didn't happen too.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Shadow Founder</h1>
        <p className="text-xs text-gray-500 mt-0.5">The nightly operating memo that reviews the day while you sleep.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Done today" value={done} tone="good" />
        <Stat label="Pipeline" value={`$${openValue}`} tone="accent" />
        <Stat label="Drafts waiting" value={drafts} tone={drafts ? 'warn' : 'default'} />
      </div>

      <Card>
        <CardHeader title="Day reads" right={<Badge tone="purple">night memo</Badge>} />
        {tasks.loading || deals.loading || emails.loading ? (
          <Spinner label="Gathering the day..." />
        ) : (
          <Empty title="Day captured" hint="Generate tonight's memo below — it uses these numbers." />
        )}
      </Card>

      <AIMemo
        toolId="shadowfounder"
        title="The Night Memo"
        sub="A founder-grade review of the day, written to future you."
        placeholder="e.g. Write tonight's memo."
        examples={['Write tonight’s founder memo', 'What should I repeat tomorrow, and what should I stop?', 'Give me the three decisions brewing']}
        context={context}
        prompt={(input, ctx) =>
          `You are the Shadow Founder for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nWrite the night memo: the day's real score, the decision that needs tomorrow, the one thing to stop, and the one thing to protect. Direct, no flattery.`
        }
        saveTitle={() => `Shadow founder memo — ${new Date().toLocaleDateString()}`}
      />
    </div>
  );
}