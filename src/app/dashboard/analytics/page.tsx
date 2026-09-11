'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, Badge, Spinner, fmtDate, money } from '@/components/platform/ui';
import { analytics } from '@/lib/core/client';

interface InsightData {
  insights: {
    openTasks: number; overdueTasks: number; pipelineTotal: number; netTotal: number;
    incomeTotal: number; expenseTotal: number;
    revenueSeries: { month: string; income: number; expense: number }[];
    pipelineByStage: { stage: string; count: number; value: number }[];
    tasksByStatus: Record<string, number>;
  };
  notes: { severity: string; text: string }[];
}

const tone = (s: string) => (s === 'good' ? 'green' : s === 'warn' ? 'amber' : 'purple') as 'green' | 'amber' | 'purple';

export default function AnalyticsPage() {
  const [d, setD] = useState<InsightData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    analytics.get().then((d) => setD(d as unknown as InsightData)).catch((e: Error) => setErr(e.message));
  }, []);

  if (!d) return err ? <p className="text-sm text-rose-400">{err}</p> : <Spinner label="Computing analytics from real records..." />;

  const maxRev = Math.max(1, ...d.insights.revenueSeries.map((r) => Math.max(r.income, r.expense)));
  const maxPipe = Math.max(1, ...d.insights.pipelineByStage.map((p) => p.value));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">Computed entirely from your workspace records.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Revenue by month" sub="Income vs expense from transactions" />
          <div className="p-4">
            {d.insights.revenueSeries.length === 0 ? (
              <p className="text-xs text-gray-600">Record transactions to see a revenue trend.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {d.insights.revenueSeries.map((r) => (
                  <div key={r.month} className="flex-1 flex items-end gap-1 justify-center">
                    {[r.income, r.expense].map((v, i) => (
                      <div
                        key={i}
                        className={`w-3 rounded-t ${i === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{ height: `${(v / maxRev) * 100}%` }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
              <span><span className="inline-block w-2 h-2 rounded bg-emerald-400 mr-1" /> income</span>
              <span><span className="inline-block w-2 h-2 rounded bg-rose-400 mr-1" /> expense</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Pipeline by stage" sub="Deal value distribution" />
          <div className="p-4 space-y-2">
            {d.insights.pipelineByStage.length === 0 ? (
              <p className="text-xs text-gray-600">Create deals to see the pipeline.</p>
            ) : d.insights.pipelineByStage.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="w-24 text-xs text-gray-400">{s.stage}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${(s.value / maxPipe) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-300 w-20 text-right">{money(s.value)} ({s.count})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Insight notes" sub="AI-generated observations from your data" />
        <div className="space-y-2 p-4">
          {d.notes.map((n, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Badge tone={tone(n.severity)}>{n.severity}</Badge>
              <span className="text-gray-300">{n.text}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Updates this month" sub="Activity that changed your numbers (real timestamps)" />
        <p className="p-4 text-xs text-gray-600">
          Tracked via your activity ledger. See the Activity page for the full feed, or run the assistant to summarize recent changes.
        </p>
      </Card>
    </div>
  );
}