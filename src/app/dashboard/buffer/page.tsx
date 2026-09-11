'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function BufferPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Buffer</h1>
        <p className="text-xs text-gray-500 mt-0.5">A cool head between you and the message that got to you.</p>
      </div>

      <AIMemo
        toolId="buffer"
        title="Cool the Message"
        sub="Paste what you were going to send — get the version your future self is grateful for."
        placeholder="e.g. I want to reply: 'Are you serious? I told you this last week.' — but I know better. Buffer it."
        examples={['My reply is heating up — cool it down', 'Rewrite this so I keep my leverage and my sleep', 'Make it firm but leave the door open']}
        prompt={(input, ctx) =>
          `You are Buffer for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nTake the heat out: rewrite in a calm, firm register that keeps the point without escalation, then note what future-you would thank you for.`
        }
        saveTitle={(input) => `Buffered reply — ${input.slice(0, 48)}`}
      />
    </div>
  );
}