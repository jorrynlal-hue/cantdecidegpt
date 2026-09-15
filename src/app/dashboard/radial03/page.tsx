'use client';

import { useState } from 'react';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import { getBrand } from '@/lib/theme';
import { useSession } from '@/components/platform/SessionProvider';
import { kitTierForPlan } from '@/lib/plans';

export default function RadialTier3Page() {
  const [brand] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));
  const { me } = useSession();
  const tier = kitTierForPlan(me?.plan);
  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#E879F9]">03 · $1,600</p>
        <h1 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">THE $1,600 PRO PREMIUMS ORBITAL</h1>
        <p className="text-[10px] text-gray-500">For the operator who wants it all — every flagship module, fully exposed. Hover, open, and add into a project flow.</p>
      </div>
      <OrbitalKits which="pro" coreLabel={brand} subtitle="System Intelligence Active" tier={tier} />
    </div>
  );
}