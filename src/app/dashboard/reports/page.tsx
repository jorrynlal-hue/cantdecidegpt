'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileBarChart2 } from 'lucide-react';
import { Card, CardHeader, Badge, Btn, Spinner, Empty, Th, Td, money, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { analytics } from '@/lib/core/client';

interface Gen { id: string; kind: string; provider: string; prompt?: string; saved: boolean; createdBy?: string; createdAt: string; }
interface Workflow { id: string; name: string; enabled: boolean; trigger: string; }
interface Execution { id: string; status: string; createdAt: string; }
interface Deal { id: string; title: string; stage: string; value: number; }

export default function ReportsPage() {
  const gen = useCollection<Gen>('generations', {});
  const workflows = useCollection<Workflow>('workflows', {});
  const executions = useCollection<Execution>('executions', {});
  const deals = useCollection<Deal>('deals', {});
  const [ins, setIns] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    analytics.get().then((r) => setIns(r.insights)).catch(() => undefined);
  }, []);

  const rows = useMemo(() => {
    const g = gen.rows;
    const byKind = new Map<string, number>();
    const byProvider = new Map<string, number>();
    const saved = g.filter((x) => x.saved).length;
    g.forEach((x) => {
      byKind.set(x.kind, (byKind.get(x.kind) ?? 0) + 1);
      byProvider.set(x.provider, (byProvider.get(x.provider) ?? 0) + 1);
    });
    const succeeded = executions.rows.filter((e) => e.status === 'completed').length;
    const won = deals.rows.filter((d) => d.stage === 'closed_won').reduce((a, d) => a + d.value, 0);
    return [
      { metric: 'Team members', value: String(Number(ins?.usersCount ?? 0)) },
      { metric: 'Connections', value: String(Number(ins?.integrationsCount ?? 0)) },
      { metric: 'Active automations', value: String(Number(ins?.activeAutomations ?? 0)) },
      { metric: 'Execution success rate', value: `${executions.rows.length ? Math.round((succeeded / executions.rows.length) * 100) : 0}%` },
      { metric: 'Deals won', value: money(won) },
      { metric: 'Open pipeline', value: money(Number(ins?.pipelineTotal ?? 0)) },
      { metric: 'Net income', value: money(Number(ins?.netTotal ?? 0)) },
      { metric: 'Generations saved', value: `${saved}/${g.length}` },
    ];
  }, [gen.rows, executions.rows, deals.rows, ins]);

  const exportCsv = () => {
    const lines: string[] = [];
    lines.push('metric,value');
    rows.forEach((r) => lines.push(`${r.metric},${r.value.replace(/,/g, '')}`));
    lines.push('');
    lines.push('generation kind,count');
    const byKind = new Map<string, number>();
    gen.rows.forEach((x) => byKind.set(x.kind, (byKind.get(x.kind) ?? 0) + 1));
    [...byKind.entries()].forEach(([k, n]) => lines.push(`${k},${n}`));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Reports</h1>
          <p className="text-xs text-gray-500 mt-0.5">Aggregated business reporting across the current workspace.</p>
        </div>
        <Btn kind="solid" onClick={exportCsv}><Download className="h-3.5 w-3.5" /> Export CSV</Btn>
      </div>

      <Card>
        <CardHeader title="Performance Report" right={<FileBarChart2 className="h-4 w-4 text-purple-400" />} />
        <table className="w-full">
          <thead><tr><Th>Metric</Th><Th>Value</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.metric} className="border-t border-white/5">
                <Td>{r.metric}</Td>
                <Td><span className="font-semibold text-white">{r.value}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Workflow Health" right={<Badge tone="purple">{workflows.rows.length}</Badge>} />
          {workflows.loading ? (
            <Spinner />
          ) : workflows.rows.length === 0 ? (
            <Empty title="No workflows" />
          ) : (
            <div className="divide-y divide-white/5">
              {workflows.rows.map((w) => {
                const runs = executions.rows.filter((e) => (e as Execution & { workflowId?: string }).workflowId === w.id).length;
                return (
                  <div key={w.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm text-gray-200">{w.name}</p>
                      <p className="text-[10px] text-gray-600">{w.trigger}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={w.enabled ? 'green' : 'gray'}>{w.enabled ? 'Enabled' : 'Disabled'}</Badge>
                      <span className="text-[10px] text-gray-500">{runs} run(s)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Generator Output" right={<Badge tone="purple">{gen.rows.length}</Badge>} />
          {gen.loading ? (
            <Spinner />
          ) : gen.rows.length === 0 ? (
            <Empty title="No generations yet" hint="Content created by AI tools will be summarized here." />
          ) : (
            <div className="divide-y divide-white/5">
              {[...gen.rows].slice(0, 12).map((x) => (
                <div key={x.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-gray-300">{x.prompt}</p>
                    <p className="text-[10px] text-gray-600">by {x.createdBy} · {fmtDate(x.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge tone={x.provider === 'baseline' ? 'gray' : 'amber'}>{x.provider}</Badge>
                    <Badge tone={x.saved ? 'green' : 'amber'}>{x.saved ? 'Saved' : 'Draft'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}