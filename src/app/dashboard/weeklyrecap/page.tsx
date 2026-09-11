'use client';

import { Card, CardHeader, Badge, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Task { id: string; title: string; status: string; priority: string; }
interface Project { id: string; name: string; status: string; }

export default function WeeklyRecapPage() {
  const tasks = useCollection<Task>('tasks');
  const projects = useCollection<Project>('projects');

  const done = tasks.rows.filter((t) => t.status === 'completed');
  const open = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;
  const activeProjects = projects.rows.filter((p) => p.status === 'active');

  const context = `${done.length} tasks completed this cycle:\n${done.slice(-8).map((t) => `- ${t.title}`).join('\n')}\nOpen tasks: ${open}\nActive projects: ${activeProjects.map((p) => p.name).join(', ') || 'none'}\n\nSummarize the week honestly — what actually got done, what didn't, and one lesson.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Weekly Recap</h1>
        <p className="text-xs text-gray-500 mt-0.5">Your week, summarized so you actually remember it.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Completed" value={done.length} tone="good" />
        <Stat label="Open" value={open} tone="warn" />
        <Stat label="Active projects" value={activeProjects.length} tone="accent" />
      </div>

      <Card>
        <CardHeader title="What finished" right={<Badge tone="green">{done.length} done</Badge>} />
        {tasks.loading ? (
          <Spinner label="Collecting the week..." />
        ) : done.length === 0 ? (
          <p className="p-4 text-xs text-gray-500">Nothing completed yet — finish a task and it will show up here.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {done.slice(-8).map((t) => (
              <li key={t.id} className="px-4 py-2 text-xs text-gray-300">{t.title}</li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="weeklyrecap"
        title="The Week, In Words"
        sub="An honest personal recap, not a scorecard."
        placeholder="e.g. Recap my week."
        examples={['Recap the week in a short journal entry', 'What did I actually get done and what slipped?', 'Turn this into a Saturday night reflection']}
        context={context}
        prompt={(input, ctx) =>
          `You are the Weekly Recap for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nWrite a warm, honest recap: what moved, what slipped, what the week taught, and one intention for next week. Under 200 words.`
        }
        saveTitle={() => `Weekly recap — ${new Date().toLocaleDateString()}`}
      />
    </div>
  );
}