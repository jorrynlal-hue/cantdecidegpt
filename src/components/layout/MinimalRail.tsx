'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';
import { getBrand } from '@/lib/theme';
import GlobalNavMenu from './GlobalNavMenu';

export default function MinimalRail() {
  const router = useRouter();
  const pathname = usePathname();
  const [brand] = useState(() => getBrand());
  const inProject = pathname.startsWith('/dashboard/projects/');

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-14 flex-col items-center gap-2 border-r border-[rgba(255,255,255,0.06)] bg-[#06070e]/95 py-3">
      {/* Logo -> projects home */}
      <button
        onClick={() => router.push('/dashboard')}
        title={brand}
        aria-label="Go to projects"
        className="rounded-lg border border-white/5 p-1 hover:border-white/15 transition-colors"
      >
        <Image src="/cantdecide-gpt-logo.png" alt={`${brand} logo`} width={26} height={26} className="h-[26px] w-[26px] rounded-md object-cover" />
      </button>

      {/* 3-dot menu — the only navigation */}
      <div className="mt-0.5"><GlobalNavMenu /></div>

      <div className="flex-1" />

      {/* context chip */}
      {inProject ? (
        <button
          onClick={() => router.back()}
          title="Back to projects"
          aria-label="Back to projects"
          className="rounded-lg border border-white/5 p-1.5 text-gray-500 hover:text-white hover:border-white/15 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => router.push('/dashboard')}
          title="Projects space"
          aria-label="Projects space"
          className={`rounded-lg border p-1.5 transition-colors ${
            pathname === '/dashboard' ? 'border-[var(--c-accent-border)] text-[var(--c-accent-text)]' : 'border-white/5 text-gray-500 hover:text-white hover:border-white/15'
          }`}
        >
          <Home className="h-4 w-4" />
        </button>
      )}
    </aside>
  );
}