'use client';

import Link from 'next/link';
import {
  ArrowRight, Check, Crown, HelpCircle, Layers, Minus, Radar, ShieldAlert, type LucideIcon,
} from 'lucide-react';
import { TOOLKIT_TIERS, FAMILIES, PREMIUM_TOOLS, BOARD_TOOLS, relationsOf } from '@/lib/radial01';
import { Card } from '@/components/platform/ui';

const STATUS_ICONS: Record<string, LucideIcon> = {
  active: Check,
  planned: Minus,
  pending: ShieldAlert,
};

export default function ToolkitsPage() {
  const totalConnections = new Set<string>();
  for (const t of BOARD_TOOLS) {
    for (const rid of relationsOf(t.id).map((p) => p.id)) {
      totalConnections.add([t.id, rid].sort().join('|'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Radial Toolkit Tiers</h1>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-gray-500">
            One operating system, three tiers. Tier 1 (Radial System 01) and Tier 2 (Radial System 02 —
            the $1,000 Premium Human Life Radial) are both shipped and live. Tier 3&apos;s spec has not been
            written, so nothing inside it is invented.
          </p>
        </div>
        <Link
          href="/dashboard/radial"
          className="flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10"
        >
          <Radar className="h-4 w-4 text-[#19C9D6]" /> Open the radial board
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TOOLKIT_TIERS.map((tier) => {
          const StatusIcon = STATUS_ICONS[tier.status];
          const isActive = tier.status === 'active';
          const accent = tier.id === 'normal' ? '#19C9D6' : tier.id === 'prokit' ? '#FF5A91' : '#9aa3b2';
          const activeBg = tier.id === 'prokit'
            ? 'border-[#FF5A91]/30 bg-[linear-gradient(160deg,rgba(255,90,145,0.10),rgba(32,38,48,0.9)_50%)]'
            : 'border-[#19C9D6]/30 bg-[linear-gradient(160deg,rgba(25,201,214,0.10),rgba(32,38,48,0.9)_50%)]';
          return (
            <Card
              key={tier.id}
              className={isActive ? activeBg : 'border-white/5'}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                    {tier.id === 'normal' ? 'Tier 1 · included' : tier.id === 'prokit' ? 'Tier 2 · premium' : 'Tier 3 · operator'}
                  </p>
                  <h2 className="mt-1 text-base font-bold text-white">{tier.name}</h2>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    background: isActive ? `${accent}24` : 'rgba(255,255,255,0.04)',
                    border: isActive ? `1px solid ${accent}55` : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {isActive ? <Layers className="h-4 w-4" style={{ color: accent }} /> : <HelpCircle className="h-4 w-4 text-gray-500" />}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-gray-400">{tier.tagline}</p>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{tier.price}</span>
                <span className="text-[10px] text-gray-500">{tier.priceNote}</span>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                <StatusIcon
                  className="h-3.5 w-3.5"
                  style={{ color: isActive ? '#00D9B2' : tier.status === 'planned' ? '#FF9D21' : '#FF4D61' }}
                />
                <span style={{ color: isActive ? '#00D9B2' : tier.status === 'planned' ? '#FF9D21' : '#FF4D61' }}>
                  {isActive ? 'Shipped & live' : tier.status === 'planned' ? 'Spec pending' : 'Not started'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {tier.included.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00D9B2]" />
                    <span className="text-xs leading-relaxed text-gray-300">{f}</span>
                  </div>
                ))}
                {tier.missing.map((f, i) => (
                  <div key={`m-${i}`} className="flex items-start gap-2 rounded-lg bg-[#0D1117]/60 px-2 py-1.5">
                    <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-600" />
                    <span className="text-xs italic leading-relaxed text-gray-500">{f}</span>
                  </div>
                ))}
              </div>

              {isActive ? (
                <Link
                  href={tier.href}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B1020]"
                  style={{ background: tier.id === 'prokit' ? 'linear-gradient(135deg, #FF5A91, #D94D8A)' : 'linear-gradient(135deg, #20D9C3, #19C9D6)' }}
                >
                  {tier.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-2.5 text-xs font-semibold text-gray-500">
                  <ShieldAlert className="h-3.5 w-3.5" /> {tier.cta} — nothing invented
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Radial 01 fact sheet */}
      <Card className="space-y-3">
        <h3 className="text-sm font-bold text-white">Radial System 01 — live fact sheet</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Tools on the ring', value: String(BOARD_TOOLS.length) },
            { label: 'CORE node', value: 'Live' },
            { label: 'PRO EXCLUSIVE', value: String(PREMIUM_TOOLS.length) },
            { label: 'Family colors', value: '5' },
            { label: 'Mapped connections', value: String(totalConnections.size) },
            { label: 'Tier 1 price', value: '$0' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-lg font-black text-white">{s.value}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {Object.values(FAMILIES).map((f) => (
            <span key={f.id} className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
              {f.label}
              {f.crown && <Crown className="h-3 w-3 text-[#FFC400]" />}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-gray-600">
          Provisioning for tiers 2 and 3 is gated on their written specifications. Activation and billing for
          shipped toolkits is handled under <Link href="/dashboard/plans" className="text-[#19C9D6] underline">Plans &amp; Billing</Link>.
        </p>
      </Card>
    </div>
  );
}