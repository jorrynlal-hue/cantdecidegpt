'use client';

import { Card, CardHeader, Badge, Spinner, Stat } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { AIMemo } from '@/components/platform/AIMemo';
import Link from 'next/link';
import { useR3Store } from '@/lib/r3';

interface Generation {
  id: string; kind: string; prompt: string; provider: string; saved: boolean; createdAt: string;
}

const THIRTY_DAYS_MARK = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export default function ProofReelPage() {
  const gens = useCollection<Generation>('generations');
  const recent = gens.rows.filter((g) => g.createdAt >= THIRTY_DAYS_MARK);
  const saved = recent.filter((g) => g.saved);
  const r3 = useR3Store();

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

      <Card>
        <CardHeader
          title="System Proof-of-Work"
          right={<Badge tone="purple">{r3.pow.length} records</Badge>}
          sub="The trust ledger of the $1,600 operator layer — every orchestrated run and every workspace generation leaves an inspectable trail here."
        />
        {r3.pow.length === 0 ? (
          <p className="p-4 text-xs text-gray-500">
            No Proof-of-Work yet. Run a job on the <Link href="/dashboard/radial03" className="text-[#B9A8E8] underline">$1,600 radial</Link> or generate in any operator workspace and the honest trail lands here.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {r3.pow.slice(0, 8).map((p) => (
              <li key={p.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-xs font-semibold text-gray-200">{p.job}</p>
                  <span className="shrink-0 text-[10px] text-gray-600">{new Date(p.at).toLocaleString()}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-500">{p.summary}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {p.chain.map((s, i) => (
                    <span key={s.name} className="flex items-center gap-1">
                      <span
                        className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
                        title={s.detail}
                        style={{ borderColor: s.ok ? 'rgba(232,131,255,0.4)' : 'rgba(255,90,115,0.4)', color: s.ok ? '#E3D6FF' : '#FF8BA0', background: s.ok ? 'rgba(232,131,255,0.08)' : 'rgba(255,90,115,0.08)' }}
                      >
                        {s.name}
                      </span>
                      {i < p.chain.length - 1 && <span className="text-[8px] text-[#D970FF]">→</span>}
                    </span>
                  ))}
                </div>
                {p.result && <p className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap text-[10px] leading-relaxed text-gray-400">{p.result}</p>}
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
          `You are Proof Reel for the CAN'T DECIDE GPT operating system. ${ctx ?? ''}\n\n${input}\n\nBuild the reel: the headline win, 3 proof points, and a short paragraph worth posting or forwarding. Make it specific, not generic.`
        }
        saveTitle={(input) => `Proof reel — ${input.slice(0, 48)}`}
      />
    </div>
  );
}