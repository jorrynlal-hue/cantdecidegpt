'use client';

import { AIMemo } from '@/components/platform/AIMemo';

export default function FixerPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Fixer</h1>
        <p className="text-xs text-gray-500 mt-0.5">Annoying thing, clear resolution. Steps and message drafts included.</p>
      </div>

      <AIMemo
        toolId="fixer"
        title="Fix It"
        sub="Describe the annoyance; get the steps to make it go away."
        placeholder="e.g. The office router drops every time it rains and no one can work. Fix it."
        examples={['Office wifi dies every time it rains — fix it', 'A client is slow-paying on repeat. Resolve it', 'Automate the report I manually send every Monday']}
        prompt={(input, ctx) =>
          `You are the Fixer for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nFix it: the likeliest cause, the ordered steps to resolve it (starting with the cheapest), the message to send if people are involved, and how to prevent it returning.`
        }
        saveTitle={(input) => `Fix — ${input.slice(0, 48)}`}
      />
    </div>
  );
}