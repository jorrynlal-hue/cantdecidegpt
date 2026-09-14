'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Btn } from '@/components/platform/ui';
import { collection } from '@/lib/core/client';
import { AIMemo } from '@/components/platform/AIMemo';

export default function RecruiterPage() {
  const [input] = useState('');
  const [busy, setBusy] = useState(false);

  const postScreeningTask = async () => {
    if (!input.trim()) return;
    setBusy(true);
    try {
      await collection.create('tasks', { title: `Screen candidates: ${input.slice(0, 60)}`, priority: 'high' });
      alert('Screening task added to your queue.');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Recruiter</h1>
        <p className="text-xs text-gray-500 mt-0.5">Role briefs, screening questions and hiring pipeline notes.</p>
      </div>

      <AIMemo
        toolId="recruiter"
        title="Role Brief Builder"
        sub="Turn a role into a full brief, screening questions and a hiring checklist."
        placeholder="e.g. Looking for a part-time marketer who can run our newsletter and Instagram, budget around $800/month."
        examples={['Write a role brief for a part-time marketer', 'Give me 5 screening questions for a virtual assistant', 'Draft a job post for a freelance web developer']}
        prompt={(input, ctx) =>
          `You are the Recruiter for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\nThe role to fill: ${input}\n\nProduce: (1) a one-paragraph role brief, (2) 5–7 screening questions, (3) what to look for in answers, (4) a 5-step hiring checklist. Keep it practical for a small team.`
        }
        saveTitle={(input) => `Role brief — ${input.slice(0, 48)}`}
      />

      <div className="flex items-center gap-2">
        <Btn onClick={postScreeningTask} disabled={busy || !input.trim()}>
          <Plus className="h-3.5 w-3.5" /> Add screening task to queue
        </Btn>
        <span className="text-[11px] text-gray-500">Your brief above is used as the task title.</span>
      </div>
    </div>
  );
}