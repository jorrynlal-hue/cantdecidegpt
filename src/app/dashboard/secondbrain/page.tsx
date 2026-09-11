'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function SecondBrainPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Second Brain</h1>
        <p className="text-xs text-gray-500 mt-0.5">The monthly memory retention interview — nothing important gets lost.</p>
      </div>

      <AIMemo
        toolId="secondbrain"
        title="Retention Interview"
        sub="Answer like you're telling a friend; the Second Brain keeps the thread."
        placeholder="e.g. Interview me about the last month — my business, the people, the decisions, what I keep forgetting."
        examples={['Interview me about the last 30 days', 'What have I learned this year, from what I tell you?', 'Turn my scattered notes into one memory file']}
        prompt={(input, ctx) =>
          `You are the Second Brain for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nRun the retention interview: ask 4 focused questions one at a time if the user answers, then consolidate what was said into a clean memory file with: facts, decisions, open loops, and the one line to never forget.`
        }
        saveTitle={(input) => `Second brain — ${input.slice(0, 48)}`}
      />
    </div>
  );
}