'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getBrand } from '@/lib/theme';
import MinimalRail from './MinimalRail';
import StatusBar from './StatusBar';
import AttentionAlerts from '../platform/AttentionAlerts';
import VoiceSystem from '../platform/VoiceSystem';
import BrandOnboarding from '../platform/BrandOnboarding';
import GlobalNavMenu from './GlobalNavMenu';
import { CreateCustomLauncher } from './CreateCustomLauncher';
import { ThemeScope } from '@/lib/theme';

function UniverseBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[#05060b]" />
      <div className="map-grid absolute inset-0" />
      <div className="absolute -left-44 top-1/4 h-[560px] w-[560px] opacity-60" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 66%)' }} />
      <div className="absolute -right-36 top-10 h-[460px] w-[460px] opacity-50" style={{ background: 'radial-gradient(circle, rgba(25,201,214,0.08), transparent 66%)' }} />
      <div className="absolute left-1/3 bottom-0 h-[420px] w-[720px] opacity-50" style={{ background: 'radial-gradient(circle, rgba(67,139,255,0.07), transparent 66%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 45%, transparent 40%, rgba(3,4,8,0.55) 100%)' }} />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [brand] = useState(() => getBrand());

  // voice: "open navigation" should open the 3-dot menu
  useEffect(() => {
    const onOpen = () => window.dispatchEvent(new Event('cdg-open-menu'));
    window.addEventListener('cdg-sidebar-open', onOpen);
    return () => window.removeEventListener('cdg-sidebar-open', onOpen);
  }, []);

  return (
    <ThemeScope>
      <div className="relative min-h-screen text-white">
        <UniverseBg />

        <MinimalRail />

        {/* mobile top control — only the small menu lives here */}
        <div className="lg:hidden fixed inset-x-0 top-0 z-40 flex items-center gap-2 bg-[#06070e]/95 px-3 py-2">
          <button onClick={() => router.push('/dashboard')} aria-label="Home" className="rounded-lg border border-white/5 p-1">
            <Image src="/cantdecide-gpt-logo.png" alt={brand} width={24} height={24} className="h-6 w-6 rounded-md object-cover" />
          </button>
          <GlobalNavMenu />
          <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-gray-500">{brand}</span>
        </div>

        <div className="relative z-10 flex min-h-screen flex-col lg:ml-14">
          <main className="flex-1">{children}</main>
          <StatusBar />
        </div>

        <AttentionAlerts />
        <VoiceSystem />
        <BrandOnboarding />
        <CreateCustomLauncher />
      </div>
    </ThemeScope>
  );
}