'use client';

import { useState } from 'react';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import { getBrand } from '@/lib/theme';
import { useSession } from '@/components/platform/SessionProvider';
import { kitTierForPlan } from '@/lib/plans';

export default function ToolkitsPage() {
  const [brand] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));
  const { me } = useSession();
  const tier = kitTierForPlan(me?.plan);
  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--c-accent-text)]">radial toolkits</p>
        <h1 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">One operating system · three shipped tiers</h1>
        <p className="ml-auto text-[10px] text-gray-500">
          Tier 1 CORE included · Tier 2 $1,000 PREMIUMS · Tier 3 $1,600 PRO PREMIUMS — the actual radial designs, fully exposed.
          Hover any tool, open it to read what it is, how to use it, and how it helps. A project&apos;s <span className="text-[var(--c-accent-text)]">toolkits</span> section adds tools straight into its flow.
        </p>
      </div>
      <OrbitalKits which="all" coreLabel={brand} subtitle="System Intelligence Active" tier={tier} />
    </div>
  );
}