'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function SecondEyesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Second Eyes</h1>
        <p className="text-xs text-gray-500 mt-0.5">A second read of anything before you hit send or sign.</p>
      </div>

      <AIMemo
        toolId="secondeyes"
        title="Review Before Send"
        sub="Paste the draft or contract — get a careful second read."
        placeholder="e.g. Read this email before I send it to a client who is frustrated: [paste text]"
        examples={['Review this email before I send it', 'Read this contract clause and tell me if it is bad for me', 'Spot anything in this proposal that could backfire']}
        prompt={(input, ctx) =>
          `You are Second Eyes for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nGive the second read: tone and clarity check, the line that could backfire, anything risky or missing, and a clean improved version. No fluff.`
        }
        saveTitle={(input) => `Second read — ${input.slice(0, 48)}`}
      />
    </div>
  );
}