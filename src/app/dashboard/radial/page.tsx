'use client';

import { useState } from 'react';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import { getBrand } from '@/lib/theme';

export default function RadialTier1Page() {
  const [brand] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));
  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2276D9]">01 · core</p>
        <h1 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">CORE TOOLKIT — included</h1>
        <p className="text-[10px] text-gray-500">The business operating system. Hover a tool, open it, add it into any project flow.</p>
      </div>
      <OrbitalKits which="core" coreLabel={brand} subtitle="System Intelligence Active" />
    </div>
  );
}