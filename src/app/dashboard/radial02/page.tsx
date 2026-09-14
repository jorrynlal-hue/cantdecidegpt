'use client';

import { useState } from 'react';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import { getBrand } from '@/lib/theme';

export default function RadialTier2Page() {
  const [brand] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));
  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF6B9D]">02 · $1,000</p>
        <h1 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">THE $1,000 PREMIUMS ORBITAL</h1>
        <p className="text-[10px] text-gray-500">For any normal to high thinker individual — life admin that sorts itself. Hover, open, and add into a project flow.</p>
      </div>
      <OrbitalKits which="premium" coreLabel={brand} subtitle="System Intelligence Active" />
    </div>
  );
}