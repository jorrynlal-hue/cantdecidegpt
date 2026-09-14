'use client';
import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BOARD_TOOLS, FAMILIES, orbit } from '@/lib/radial01';
import { HUB, PREMIUM_TOOLS as P2_TOOLS } from '@/lib/radial02';
import { HUB3, OPERATOR_TOOLS as P3_TOOLS } from '@/lib/radial03';

const DND_MIME = 'application/x-cdgtool';
const KIT_R = 72;

interface KitItem { id: string; name: string; color: string; x: number; y: number; f: boolean; }
interface KitTier {
  id: 's1' | 's2' | 's3';
  name: string;
  price: string;
  centerTag: string;
  centerSub: string;
  grad: string;
  rings: number[];
  legend?: { label: string; color: string }[];
  items: KitItem[];
}

export default function ToolkitPanel(props: {
  tier: string | undefined;
  flowToolIds: string[];
  accent: string;
  onToggleTool: (id: string) => void;
}) {
  const { tier, flowToolIds, accent, onToggleTool } = props;
  const [open, setOpen] = useState<Record<string, boolean>>({ s1: true, s2: false, s3: false });
  const inFlow = useMemo(() => new Set(flowToolIds), [flowToolIds]);
  const limit = !tier || tier === 'normal' ? 3 : 5;
  const used = flowToolIds.length;

  const tiers = useMemo<KitTier[]>(() => {
    const CX = 160, CY = 106;
    return [
      {
        id: 's1',
        name: 'Radial System 01',
        price: '$0',
        centerTag: 'CORE',
        centerSub: '24 tools',
        grad: 'linear-gradient(135deg,#20D9C3 0%,#19C9D6 55%,#2486EA 100%)',
        rings: [Math.round(KIT_R * 0.3), Math.round(KIT_R * 0.47)],
        legend: Object.values(FAMILIES).map((f) => ({ label: f.label, color: f.color })),
        items: BOARD_TOOLS.map((t) => {
          const o = orbit(t);
          return { id: t.id, name: t.name, color: o.color, x: CX + o.x * KIT_R, y: CY + o.y * KIT_R, f: t.premium };
        }),
      },
      {
        id: 's2',
        name: 'The $1,000 Premiums',
        price: '$1,000',
        centerTag: 'PREMIUMS',
        centerSub: '10 tools',
        grad: HUB.gradient,
        rings: [Math.round(KIT_R * 0.42)],
        items: P2_TOOLS.map((t) => ({ id: t.id, name: t.name, color: t.accent, x: CX + t.pos.x * KIT_R, y: CY + t.pos.y * KIT_R, f: t.flagship })),
      },
      {
        id: 's3',
        name: 'The $1,600 Pro Premiums',
        price: '$1,600',
        centerTag: 'PRO',
        centerSub: '19 tools',
        grad: HUB3.gradient,
        rings: [Math.round(KIT_R * 0.42)],
        items: P3_TOOLS.map((t) => ({ id: t.id, name: t.name, color: t.accent, x: CX + t.pos.x * KIT_R, y: CY + t.pos.y * KIT_R, f: t.flagship })),
      },
    ];
  }, []);

  const dragStart = (e: React.DragEvent, item: KitItem) => {
    e.dataTransfer.setData(DND_MIME, JSON.stringify({ id: item.id }));
    e.dataTransfer.effectAllowed = 'copy';
    (e.currentTarget as HTMLElement).style.opacity = '0.55';
  };
  const dragEnd = (e: React.DragEvent) => { (e.currentTarget as HTMLElement).style.opacity = '1'; };

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-main)]">Toolkit</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
          {used}/{limit} tools in plan
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span>Plan use</span>
          <span className={used > limit ? 'font-semibold text-amber-300' : 'tabular-nums'}>
            {Math.min(used, limit)} of {limit} slots used
            {used > limit ? ` · ${used - limit} over` : ''}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={used > limit ? 'h-full rounded-full bg-amber-400/80' : 'h-full rounded-full'}
            style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%`, background: used > limit ? undefined : accent }}
          />
        </div>
        {used > limit && (
          <p className="mt-2 text-[10px] text-amber-300">This project uses more tools than your plan allows — upgrade for a 5-tool flow.</p>
        )}
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-gray-500">
        Drag a tool straight into the flow on the left, or click a dot to attach / detach it.
      </p>

      <div className="space-y-3">
        {tiers.map((tierCfg) => {
          const isOpen = open[tierCfg.id];
          return (
            <div key={tierCfg.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/4">
              <button
                onClick={() => setOpen((o) => ({ ...o, [tierCfg.id]: !o[tierCfg.id] }))}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: tierCfg.id === 's1' ? '#20D9C3' : tierCfg.id === 's2' ? '#FF5A91' : '#9B6CFF' }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-gray-200">{tierCfg.name}</span>
                  <span className="block text-[10px] text-gray-500">{tierCfg.price} · {tierCfg.items.length} tools</span>
                </span>
                <span className="text-[10px] text-gray-500 tabular-nums">{flowToolIds.filter((id) => tierCfg.items.some((it) => it.id === id)).length} in flow</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="border-t border-white/5 px-2 pb-3 pt-1">
                  <div className="relative h-[220px]">
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 212">
                      {tierCfg.rings.map((r, i) => (
                        <circle key={i} cx={160} cy={106} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeDasharray="4 4" />
                      ))}
                      {tierCfg.items.map((it) => {
                        const dx = 160 - it.x, dy = 106 - it.y;
                        const len = Math.hypot(dx, dy) || 1;
                        const tx = it.x + (dx / len) * 9, ty = it.y + (dy / len) * 9;
                        return (
                          <g key={it.id} opacity={inFlow.has(it.id) ? 0.9 : 0.28}>
                            <line x1={it.x} y1={it.y} x2={tx} y2={ty} stroke={accent} strokeWidth="1" />
                            <path d={`M ${it.x - (dx / len) * 2} ${it.y - (dy / len) * 2} l ${(dx / len) * 4} ${(dy / len) * 4} m 0 0 l ${(dx / len) * 4} ${-(dy / len) * 4}`} stroke={accent} strokeWidth="1" fill="none" opacity="0.5" />
                          </g>
                        );
                      })}
                      <circle cx={160} cy={106} r={22} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.22)" strokeDasharray="3 3" />
                    </svg>

                    <div className="absolute left-1/2 top-[86px] z-10 -translate-x-1/2 text-center">
                      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg" style={{ background: tierCfg.grad, boxShadow: `0 0 22px ${tierCfg.id === 's1' ? '#19C9D6' : tierCfg.id === 's2' ? '#FF5A91' : '#9B6CFF'}55` }}>
                        {tierCfg.centerTag}
                      </div>
                      <p className="mt-1 text-[9px] uppercase tracking-widest text-gray-500">{tierCfg.centerSub}</p>
                    </div>

                    {tierCfg.items.map((it) => {
                      const has = inFlow.has(it.id);
                      return (
                        <button
                          key={it.id}
                          draggable
                          onDragStart={(e) => dragStart(e, it)}
                          onDragEnd={dragEnd}
                          onClick={() => onToggleTool(it.id)}
                          title={`${it.name}${has ? ' · in this flow' : ''} — drag in or click`}
                          className="absolute z-20 flex h-[16px] w-[16px] cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
                          style={{ left: it.x, top: it.y, transform: 'translate(-50%,-50%)' }}
                        >
                          <span
                            className={`h-[10px] w-[10px] rounded-full transition-all ${has ? 'scale-110' : ''}`}
                            style={{
                              background: has ? accent : it.color,
                              opacity: has ? 1 : 0.62,
                              boxShadow: has ? `0 0 0 2px rgba(255,255,255,0.85)` : `0 0 0 1px rgba(255,255,255,0.2)`,
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {tierCfg.legend && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 px-1">
                      {tierCfg.legend.map((l) => (
                        <span key={l.label} className="flex items-center gap-1 text-[9px] text-gray-500">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} /> {l.label}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 px-1 text-[9px] leading-relaxed text-gray-600">
                    {tierCfg.id === 's1' ? 'The 24-tool orbital command center on every workspace.' :
                     tierCfg.id === 's2' ? 'The premium pink ring — the 10 tools that run a life.' :
                     'The pro operator ring — 19 tools, Proof-of-Work chain, approvals.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}