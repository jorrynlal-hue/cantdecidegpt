'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function ResearcherPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Researcher</h1>
        <p className="text-xs text-gray-500 mt-0.5">Deep-dive, structured briefs on any person, market or topic.</p>
      </div>

      <AIMemo
        toolId="researcher"
        title="Deep Dive"
        sub="One topic in, a structured research brief out."
        placeholder="e.g. Research the market for small-business bookkeeping AI assistants and who the main players are."
        examples={['Brief me on the AI bookkeeping market and its players', 'Deep dive: how competitors price virtual CFO services', 'Prepare a pre-meeting brief on a prospect company']}
        prompt={(input, ctx) =>
          `You are the Researcher for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nProduce a structured brief: the landscape, the key players with one line each, the dynamics that matter, the open questions, and 3 sources worth checking. Label uncertainty clearly.`
        }
        saveTitle={(input) => `Research brief — ${input.slice(0, 48)}`}
        kind="reference"
      />
    </div>
  );
}