'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function ConsultantPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Consultant Button</h1>
        <p className="text-xs text-gray-500 mt-0.5">Instant senior-consultant-level advice on whatever you are facing.</p>
      </div>

      <AIMemo
        toolId="consultant"
        title="On Call"
        sub="State the situation; get the billing-advice-tier answer."
        placeholder="e.g. I have a $9,000 client deciding between two directions and my gut says one of them. What do I advise?"
        examples={['Should I raise prices or add a service tier?', 'A big client wants a contract change mid-project — advice?', 'Walk me through how a consulting engagement would fix this mess']}
        prompt={(input, ctx) =>
          `You are the Consultant Button for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nGive the kind of answer that earns $500/hr: a crisp read of the situation, the decision framing, your recommendation with reasoning, the risk you'd be wrong, and the 3 moves you'd make by Friday.`
        }
        saveTitle={(input) => `Consult consult — ${input.slice(0, 48)}`}
      />
    </div>
  );
}