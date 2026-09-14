'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function AutoRenegoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Auto-Renegotiate</h1>
        <p className="text-xs text-gray-500 mt-0.5">Renewal campaigns for subscriptions, contracts and recurring costs.</p>
      </div>

      <AIMemo
        toolId="autorenego"
        title="Renegotiation Campaign"
        sub="Paste what you pay, get the ask, the script and the timing."
        placeholder="e.g. Software subscription at $120/mo, stripper of value, cancel in 12 days. Plan the renegotiation."
        examples={['$120/mo software subscription, renews in 12 days — plan the reneg', 'List 5 expenses worth renegotiating and in what order', 'Write the opener email for renegotiating my hosting bill']}
        prompt={(input, ctx) =>
          `You are Auto-Renegotiate for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nDeliver the campaign: the opener message, the strongest leverage, the walk-away number, the follow-up sequence, and a hard date for each step. Polite, firm, factual.`
        }
        saveTitle={(input) => `Renegotiation — ${input.slice(0, 48)}`}
      />
    </div>
  );
}