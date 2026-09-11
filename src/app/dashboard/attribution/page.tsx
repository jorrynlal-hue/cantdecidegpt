'use client';

import { Waypoints, Users, FileText, MessagesSquare } from 'lucide-react';
import { Card, CardHeader, Badge, Empty, Spinner, Th, Td, fmtDate } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';

interface Gen { id: string; kind: string; provider: string; prompt: string; createdBy: string; saved: boolean; createdAt: string; }
interface Content { id: string; title: string; createdAt: string; }
interface Conv { id: string; title: string; updatedAt: string; }

export default function AttributionPage() {
  const gen = useCollection<Gen>('generations', {});
  const content = useCollection<Content>('content', {});
  const convs = useCollection<Conv>('conversations', {});

  const providers = new Map<string, number>();
  const owners = new Map<string, number>();
  gen.rows.forEach((g) => {
    providers.set(g.provider, (providers.get(g.provider) ?? 0) + 1);
    owners.set(g.createdBy, (owners.get(g.createdBy) ?? 0) + 1);
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Attribution</h1>
        <p className="text-xs text-gray-500 mt-0.5">Source and provenance tracking across every generated asset.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><div className="flex items-center gap-2"><Waypoints className="h-4 w-4 text-amber-300" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Generations</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{gen.rows.length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Saved content</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{content.rows.length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><MessagesSquare className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Conversations</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{convs.rows.length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-400" /><p className="text-[11px] uppercase tracking-wider text-gray-500">Sources active</p></div><p className="mt-1.5 text-2xl font-bold text-purple-400">{providers.size}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="By Provider" right={<Badge tone="amber">provenance</Badge>} />
          <div className="divide-y divide-white/5">
            {[...providers.entries()].map(([p, n]) => (
              <div key={p} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-200">{p}</span>
                <Badge tone="purple">{n} assets</Badge>
              </div>
            ))}
            {providers.size === 0 && <Empty title="No provenance data yet" hint="Generate or save content and attribution will track where it came from." />}
          </div>
        </Card>
        <Card>
          <CardHeader title="By Creator" right={<Badge tone="purple">{owners.size}</Badge>} />
          <div className="divide-y divide-white/5">
            {[...owners.entries()].map(([u, n]) => (
              <div key={u} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-200">{u}</span>
                <Badge tone="blue">{n} generations</Badge>
              </div>
            ))}
            {owners.size === 0 && <Empty title="No creators yet" />}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Asset Ledger" right={<Badge tone="purple">{gen.rows.length}</Badge>} />
        {gen.loading ? (
          <Spinner />
        ) : (
          <table className="w-full">
            <thead><tr><Th>Prompt</Th><Th>Kind</Th><Th>Provider</Th><Th>Creator</Th><Th>Status</Th><Th>When</Th></tr></thead>
            <tbody>
              {gen.rows.map((g) => (
                <tr key={g.id} className="border-t border-white/5">
                  <Td><span className="truncate font-medium text-gray-100">{g.prompt}</span></Td>
                  <Td><Badge tone="blue">{g.kind}</Badge></Td>
                  <Td><Badge tone={g.provider === 'baseline' ? 'gray' : 'amber'}>{g.provider}</Badge></Td>
                  <Td>{g.createdBy}</Td>
                  <Td><Badge tone={g.saved ? 'green' : 'amber'}>{g.saved ? 'Saved' : 'Draft'}</Badge></Td>
                  <Td>{fmtDate(g.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}