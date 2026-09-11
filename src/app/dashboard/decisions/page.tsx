'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function DecisionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Decisions</h1>
        <p className="text-xs text-gray-500 mt-0.5">Structure hard calls instead of looping on them.</p>
      </div>

      <AIMemo
        toolId="decisions"
        title="The Decision Frame"
        sub="Options, trade-offs, and a clear pick."
        placeholder="e.g. Take a $35k full-time role or keep building my own thing which makes $1,500/mo and is growing."
        examples={['Take the job or keep building my own thing?', 'Should I raise prices now or after the holiday rush?', 'Decision between two short and one long commitment']}
        prompt={(input, ctx) =>
          `You are the Decision Compass for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nFrame the decision: the real options, what each protects and costs, the regret question (in a year, which choice do I regret less), what more info would change nothing, and the actual pick.`
        }
        saveTitle={(input) => `Decision — ${input.slice(0, 48)}`}
      />
    </div>
  );
}