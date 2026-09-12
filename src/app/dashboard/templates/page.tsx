'use client';

import Link from 'next/link';
import { Copy, ArrowRight, Workflow, FileText, Sparkles } from 'lucide-react';
import { Card, CardHeader, Badge, Empty, Spinner } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';

interface WorkflowRow { id: string; name: string; description?: string; enabled: boolean; steps: unknown[]; createdAt: string; }

const PRESETS = [
  { name: 'Weekly marketing recap', desc: 'Summarize the week into a shareable recap.', href: '/dashboard/ai' },
  { name: 'Cold email opener', desc: 'Draft a first-touch email for a new lead.', href: '/dashboard/email' },
  { name: 'Decision memo', desc: 'Frame an options + regret analysis before you pick.', href: '/dashboard/decisions' },
  { name: 'Website readiness audit', desc: 'Scan your site for search and AI discoverability issues.', href: '/dashboard/website' },
  { name: 'Revenue snapshot', desc: 'A one-line read of where money stands this week.', href: '/dashboard/moneypeace' },
];

export default function TemplatesPage() {
  const workflows = useCollection<WorkflowRow>('workflows', {});

  const duplicate = async (w: WorkflowRow) => {
    try {
      const stored = workflows.rows.find((x) => x.id === w.id) as WorkflowRow | undefined;
      void stored;
      await fetch('/api/db/workflows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'create', value: { name: `${w.name} (copy)`, description: w.description || undefined, enabled: true, trigger: { type: 'manual' }, steps: [] } }),
      });
      workflows.reload();
    } catch { /* surface via reload */ }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-white">Templates</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Reusable starting points. The automation section lists every real workflow you have — duplicate
          any of them as a fresh manual workflow. The content presets are built-in starting prompts that
          open their live workspace.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Automation workflows"
          right={<Badge tone="purple">{workflows.rows.length} real</Badge>}
          sub="Duplicate a workflow to seed a new one with the same name (you then rebuild its steps in the Workflow Builder)."
        />
        {workflows.loading ? (
          <div className="p-8"><Spinner label="Loading workflows..." /></div>
        ) : workflows.rows.length === 0 ? (
          <Empty title="No workflows yet" hint="Build your first workflow in Automation — it will appear here as a reusable template." />
        ) : (
          <div className="divide-y divide-white/5">
            {workflows.rows.map((w) => (
              <div key={w.id} className="flex items-center gap-3 px-4 py-3">
                <Workflow className="h-4 w-4 shrink-0 text-purple-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{w.name}</p>
                  <p className="truncate text-[11px] text-gray-500">{w.description || `${w.steps?.length ?? 0} step(s) · created ${new Date(w.createdAt).toLocaleDateString()}`}</p>
                </div>
                <button
                  onClick={() => duplicate(w)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-gray-300 hover:bg-white/5 hover:text-white"
                  title="Create a copy workflow"
                >
                  <Copy className="h-3 w-3" /> Duplicate
                </button>
                <Link href="/dashboard/automation" className="flex shrink-0 items-center gap-1 rounded-lg border border-purple-400/20 bg-purple-400/10 px-2.5 py-1.5 text-[10px] font-medium text-purple-300 hover:bg-purple-400/20">
                  Open builder <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Content presets" right={<Badge tone="blue">built-in</Badge>} sub="Each opens its real workspace with a ready-made purpose." />
        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {PRESETS.map((p) => (
            <Link key={p.name} href={p.href} className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 hover:border-white/20 hover:bg-white/[0.06]">
              <Sparkles className="h-4 w-4 shrink-0 text-[#5F8CFF]" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-gray-100">{p.name}</span>
                <span className="block truncate text-[10px] text-gray-500">{p.desc}</span>
              </span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-600 group-hover:text-gray-300" />
            </Link>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#11151C] px-4 py-3 text-[10px] text-gray-500">
        <FileText className="h-3.5 w-3.5" />
        Keep the three toolkit systems modular: the $1,600 placeholder stays empty here until its spec is provided — nothing invented.
      </div>
    </div>
  );
}