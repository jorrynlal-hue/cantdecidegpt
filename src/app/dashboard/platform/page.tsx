'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Send } from 'lucide-react';
import { Card, CardHeader, Stat, Badge, Spinner, fmtDateTime } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { analytics } from '@/lib/core/client';

interface InsightData {
  insights: {
    openTasks: number;
    overdueTasks: number;
    pipelineTotal: number;
    netTotal: number;
    incomeTotal: number;
    expenseTotal: number;
    revenueSeries: { month: string; income: number; expense: number }[];
    pipelineByStage: { stage: string; count: number; value: number }[];
    tasksByStatus: Record<string, number>;
  };
  notes: { severity: string; text: string }[];
}

interface Activity {
  id: string;
  actorSource: string;
  action: string;
  result: string;
  objectLabel?: string;
  at: string;
}

export default function PlatformPage() {
  const tasks = useCollection('tasks', { status: 'all' });
  const deals = useCollection('deals', {});
  const txns = useCollection('transactions', {});
  const [ins, setIns] = useState<InsightData | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [ask, setAsk] = useState('');

  useEffect(() => {
    analytics.get().then((d) => setIns(d as unknown as InsightData)).catch(() => {});
    analytics.activity().then((d) => setActivity((d.activities as Activity[]) ?? [])).catch(() => {});
  }, []);

  if (!ins) return <Spinner label="Loading workspace insights..." />;

  const openTasks = ins.insights.openTasks;
  const noteTone = (s: string) => (s === 'good' ? 'green' : s === 'warn' ? 'amber' : 'purple') as 'green' | 'amber' | 'purple';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Workspace Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            All numbers below are computed from <span className="text-purple-400">real records you create</span> — nothing is fabricated.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ask.trim()) window.location.href = `/dashboard/ai?q=${encodeURIComponent(ask)}`;
            }}
            placeholder="Ask the AI assistant..."
            className="flex-1 sm:w-72 rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
          />
          <Link
            href={`/dashboard/ai${ask.trim() ? `?q=${encodeURIComponent(ask)}` : ''}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-medium text-white"
          >
            <Send className="w-3.5 h-3.5" /> Ask
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Open tasks" value={openTasks} hint={`${ins.insights.overdueTasks} overdue`} tone={ins.insights.overdueTasks ? 'warn' : 'default'} />
        <Stat label="Pipeline value" value={ins.insights.pipelineTotal.toLocaleString()} hint={`${deals.rows.length} deals`} tone="accent" />
        <Stat label="Net balance" value={ins.insights.netTotal.toLocaleString()} hint={`${ins.insights.incomeTotal.toLocaleString()} in · ${ins.insights.expenseTotal.toLocaleString()} out`} tone={ins.insights.netTotal >= 0 ? 'good' : 'warn'} />
        <Stat label="Records tracked" value={`${tasks.rows.length + deals.rows.length + txns.rows.length}`} hint="tasks + deals + transactions" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="AI insights" sub="Derived from your real data" />
          <div className="space-y-2 p-4">
            {ins.notes.map((n, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 text-purple-400 shrink-0" />
                <span className="text-gray-300">{n.text}</span>
                <Badge tone={noteTone(n.severity)}>{n.severity}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" sub="Everyone & every automation" right={<Link href="/dashboard/activity" className="text-[11px] text-purple-400">view all</Link>} />
          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {activity.slice(0, 12).map((a) => (
              <div key={a.id} className="px-4 py-2.5">
                <p className="text-xs text-gray-300">{a.result}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {a.actorSource} · {fmtDateTime(a.at)}
                </p>
              </div>
            ))}
            {activity.length === 0 && <p className="px-4 py-6 text-xs text-gray-600">No activity yet — create a task to get started.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Create task', href: '/dashboard/work', icon: 'Tasks' },
          { label: 'Add customer', href: '/dashboard/crm', icon: 'CRM' },
          { label: 'Send email', href: '/dashboard/email', icon: 'Email' },
          { label: 'Generate content', href: '/dashboard/ai', icon: 'AI Studio' },
          { label: 'Upload document', href: '/dashboard/docs', icon: 'Documents' },
          { label: 'Record finance', href: '/dashboard/finance', icon: 'Finance' },
          { label: 'Build automation', href: '/dashboard/automation', icon: 'Automation' },
          { label: 'Create campaign', href: '/dashboard/marketing', icon: 'Marketing' },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="group flex items-center justify-between rounded-xl border border-white/8 bg-[#101018] px-4 py-3 hover:border-purple-500/30 transition-colors">
            <span className="text-xs font-medium text-gray-300">{c.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-purple-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}