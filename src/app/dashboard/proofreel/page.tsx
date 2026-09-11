'use client';

import { Card, CardHeader, Badge, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';

interface Generation {
  id: string; kind: string; prompt: string; provider: string; saved: boolean; createdAt: string;
}

const THIRTY_DAYS_MARK = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export default function ProofReelPage() {
  const gens = useCollection<Generation>('generations');
  const recent = gens.rows.filter((g) => g.createdAt >= THIRTY_DAYS_MARK);
  const saved = recent.filter((g) => g.saved);

  const context = `${recent.length} pieces produced in the last 30 days (${saved.length} saved). Sample:\n${recent.slice(-8).map((g) => `- [${g.kind}] ${g.prompt.slice(0, 80)}`).join('\n')}\n\nCompile the month's proof reel: what was produced, what it proves, and a shareable summary.`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Proof Reel</h1>
        <p className="text-xs text-gray-500 mt-0.5">The month&apos;s wins — compiled automatically into a shareable reel.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Produced (30d)" value={recent.length} tone="good" />
        <Stat label="Saved" value={saved.length} tone="accent" />
        <Stat label="All time" value={gens.rows.length} />
      </div>

      <Card>
        <CardHeader title="Recent output" right={<Badge tone="purple">{recent.length} items</Badge>} />
        {gens.loading ? (
          <Spinner label="Scanning your output..." />
        ) : recent.length === 0 ? (
          <p className="p-4 text-xs text-gray-500">Nothing generated recently. Ask the AI section to create something and it will appear here.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {recent.slice(-8).map((g) => (
              <li key={g.id} className="px-4 py-2">
                <p className="text-xs text-gray-300">{g.prompt}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-600">{g.kind} · {g.saved ? 'saved' : 'unsaved'}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AIMemo
        toolId="proofreel"
        title="Compile the Reel"
        sub="Turn your output into a proof-of-work summary worth sharing."
        placeholder="e.g. Compile this month's proof reel."
        examples={['Compile the month’s proof reel', 'Write a client-ready summary of what we produced', 'Turn the last 30 days into a portfolio blurb']}
        context={context}
        prompt={(input, ctx) =>
          `You are Proof Reel for the Imprint operating system. ${ctx ?? ''}\n\n${input}\n\nBuild the reel: the headline win, 3 proof points, and a short paragraph worth posting or forwarding. Make it specific, not generic.`
        }
        saveTitle={(input) => `Proof reel — ${input.slice(0, 48)}`}
      />
    </div>
  );
}