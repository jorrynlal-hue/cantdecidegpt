'use client';

import { useEffect, useState } from 'react';
import { Activity, Lightbulb } from 'lucide-react';
import { Card, CardHeader, Badge, Empty, Spinner, Th, Td, money } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { analytics } from '@/lib/core/client';

interface Gen { id: string; kind: string; provider: string; prompt: string; saved: boolean; createdAt: string; }
type Note = { severity: string; text: string };
type Act = { id: string; action?: string; result?: string; at: string };

export default function InsightsPage() {
  const gen = useCollection<Gen>('generations', {});
  const [ins, setIns] = useState<{ pipelineTotal?: number; netTotal?: number; openTasks?: number } | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analytics.get()
      .then((res) => {
        setIns(res.insights);
        setNotes(res.notes);
      })
      .catch(() => undefined);
    analytics.activity().then((res) => setActs((res.activities as Act[]) ?? [])).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const providers = new Set(gen.rows.map((g) => g.provider));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Insights</h1>
        <p className="text-xs text-gray-500 mt-0.5">Derived intelligence observations over live workspace data.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Open pipeline</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{money(Number(ins?.pipelineTotal ?? 0))}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Net income</p><p className="mt-1.5 text-2xl font-bold text-emerald-400">{money(Number(ins?.netTotal ?? 0))}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Open tasks</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{ins?.openTasks ?? 0}</p></Card>
        <Card className="p-4"><p className="text-[11px] uppercase tracking-wider text-gray-500">Generations</p><p className="mt-1.5 text-2xl font-bold text-purple-400">{gen.rows.length}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Observations" right={<Lightbulb className="h-4 w-4 text-purple-400" />} />
          {loading ? (
            <Spinner />
          ) : (
            <div className="space-y-2 p-4">
              {notes.map((n, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge tone={n.severity === 'warn' ? 'amber' : n.severity === 'good' ? 'green' : 'blue'}>{n.severity}</Badge>
                  <p className="text-xs text-gray-300">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent Activity" right={<Activity className="h-4 w-4 text-purple-400" />} />
          {loading ? (
            <Spinner />
          ) : (
            <div className="divide-y divide-white/5">
              {acts.length === 0 && <Empty title="No activity yet" />}
              {acts.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-purple-300">{a.action ?? 'event'}</span>
                    <span className="text-xs text-gray-300">{a.result}</span>
                  </div>
                  <span className="text-[10px] text-gray-600">{new Date(a.at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Intelligence Inventory" sub="Generation providers actively used in this workspace" right={<Badge tone="purple">{providers.size} providers</Badge>} />
        {gen.loading ? (
          <Spinner />
        ) : gen.rows.length === 0 ? (
          <Empty title="No generations yet" hint="Generate content through the AI studio and it will appear here." />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Prompt</Th><Th>Kind</Th><Th>Provider</Th><Th>Status</Th><Th>When</Th></tr></thead>
            <tbody>
              {gen.rows.map((g) => (
                <tr key={g.id} className="border-t border-white/5">
                  <Td><span className="truncate font-medium text-gray-100">{g.prompt}</span></Td>
                  <Td><Badge tone="blue">{g.kind}</Badge></Td>
                  <Td>{g.provider}</Td>
                  <Td><Badge tone={g.saved ? 'green' : 'amber'}>{g.saved ? 'Saved' : 'Draft'}</Badge></Td>
                  <Td>{new Date(g.createdAt).toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}