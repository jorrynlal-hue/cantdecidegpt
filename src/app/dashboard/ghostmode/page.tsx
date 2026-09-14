'use client';

import { Card, CardHeader, Badge, Btn, Empty, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

interface Workflow {
  id: string; name: string; description?: string; enabled: boolean; trigger: { type: string };
}

export default function GhostModePage() {
  const workflows = useCollection<Workflow>('workflows');
  const enabled = workflows.rows.filter((w) => w.enabled).length;

  const toggle = async (id: string, next: boolean) => {
    try {
      await collection.update('workflows', id, { enabled: next });
      workflows.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Ghost Mode</h1>
        <p className="text-xs text-gray-500 mt-0.5">Hands-off automation: step back and let the machine run — with a hand-off memo.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Automations" value={workflows.rows.length} />
        <Stat label="Live (ghost)" value={enabled} tone="good" />
        <Stat label="Paused" value={workflows.rows.length - enabled} tone="warn" />
      </div>

      <Card>
        <CardHeader title="Automation Board" right={<Badge tone={enabled > 0 ? 'green' : 'gray'}>{enabled ? `${enabled} live` : 'all paused'}</Badge>} />
        {workflows.loading ? (
          <Spinner label="Loading automations..." />
        ) : workflows.rows.length === 0 ? (
          <Empty title="No automations yet" hint="Build workflows in Automation, then flip them on here." />
        ) : (
          <ul className="divide-y divide-white/5">
            {workflows.rows.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="text-xs font-medium text-gray-100">{w.name}</p>
                  <p className="text-[10px] text-gray-500">trigger · {w.trigger.type}</p>
                </div>
                <Btn small kind={w.enabled ? 'outline' : 'solid'} onClick={() => toggle(w.id, !w.enabled)}>
                  {w.enabled ? 'Pause' : 'Enable'}
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="ghostmode"
        title="Hand-off Memo"
        sub="Write the leave-behind that tells the machine exactly what to run while you step away."
        placeholder="e.g. I am stepping away for 48 hours. Hand off what to run, what to hold, and what to flag to me."
        examples={['Hand off the next 48 hours while I am gone', 'What should automation run on its own this week?', 'Write the memo for full ghost mode']}
        prompt={(input, ctx) =>
          `You are Ghost Mode for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nProduce the hand-off memo: (1) what runs automatically, (2) what is held for a human, (3) the red lines that should stop everything, (4) how to reach the owner.`
        }
        saveTitle={(input) => `Ghost hand-off — ${input.slice(0, 48)}`}
      />
    </div>
  );
}