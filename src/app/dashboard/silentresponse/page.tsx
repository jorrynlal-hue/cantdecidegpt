'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function SilentResponsePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Silent Response</h1>
        <p className="text-xs text-gray-500 mt-0.5">Calm, composed replies to the messages that make you want to react.</p>
      </div>

      <AIMemo
        toolId="silentresponse"
        title="Respond Calmly"
        sub="Paste the provocation — get a reply that keeps your leverage."
        placeholder="e.g. A client just wrote: 'This is unacceptable, we are done.' Draft a reply that holds the line without burning the bridge."
        examples={['"This is unacceptable, we are done." — draft the reply', 'A partner is trying to guilt me into a discount. Compose the calm answer', 'Fix my angry draft into something that keeps the high ground']}
        prompt={(input, ctx) =>
          `You are Silent Response for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nDraft the reply: acknowledges their point, does not surrender yours, buys breathing room, leaves the door open. Under 100 words, no apology where none is owed.`
        }
        saveTitle={(input) => `Silent response — ${input.slice(0, 48)}`}
      />
    </div>
  );
}