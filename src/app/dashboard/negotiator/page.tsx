'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function NegotiatorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Negotiator</h1>
        <p className="text-xs text-gray-500 mt-0.5">Fair-but-firm draft positions and scripts for any negotiation.</p>
      </div>

      <AIMemo
        toolId="negotiator"
        title="Draft Your Position"
        sub="Get the anchor, the room, the script and the walk-away."
        placeholder="e.g. A client is asking for a 30% discount on a $5,000 project. I can give 10% at most, and only if paid upfront."
        examples={['Client wants 30% off a $5,000 project — draft my position', 'Renegotiating my retainer, draft the opening', 'I am buying a used car at $3,400. Script the negotiation']}
        prompt={(input, ctx) =>
          `You are the Negotiator for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nGive the negotiator's kit: the anchor, the zone of possible agreement, the first offer you make, the script for the opener and the counter, and your walk-away line. Fair but firm.`
        }
        saveTitle={(input) => `Negotiation kit — ${input.slice(0, 48)}`}
      />
    </div>
  );
}