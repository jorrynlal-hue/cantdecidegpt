'use client';
import { ArrowUpRight, Link2, Star, TriangleAlert, Zap } from 'lucide-react';

export interface GlassIntegration {
  id: string;
  name: string;
  status: string;
  key?: string;
}

export interface GlassAttention {
  id: string;
  title: string;
  projectId?: string;
  projectName?: string;
  priority: string;
  kind?: string;
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
    </span>
  );
}

export function IntegrationGlassCard(props: {
  items: GlassIntegration[];
  href?: string;
  onManage?: () => void;
}) {
  const { items, href, onManage } = props;
  const visible = items.slice(0, 6);
  const more = items.length - visible.length;
  return (
    <div className="glass overflow-hidden rounded-2xl border-sky-400/30" style={{ background: 'linear-gradient(160deg, rgba(56,189,248,0.14) 0%, rgba(11,15,26,0.72) 45%, rgba(56,189,248,0.07) 100%)' }}>
      <div className="flex items-center gap-2 border-b border-sky-400/20 px-4 py-3">
        <Star className="blink-star h-4 w-4 fill-sky-300 text-sky-300" />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200">Connected services</p>
        <span className="ml-auto rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200 tabular-nums">{items.length}</span>
      </div>
      <div className="space-y-1 px-3 py-3">
        {visible.length === 0 ? (
          <p className="flex items-center gap-2 px-2 py-3 text-[11px] text-gray-500">
            <Link2 className="h-3.5 w-3.5" /> No connections yet &mdash; link a service and live data starts flowing.
          </p>
        ) : (
          visible.map((i) => (
            <div key={i.id} className="flex items-center gap-2.5 rounded-xl border border-sky-400/15 bg-[#0b0f1a]/70 px-3 py-2">
              <LiveDot />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-sky-100">{i.name}</span>
              <span className="text-[9px] uppercase tracking-wider text-sky-300/70">{i.status}</span>
              {i.key ? <span className="hidden text-[9px] text-gray-600 sm:inline">{i.key.split('.')[0]}</span> : null}
            </div>
          ))
        )}
        {more > 0 && <p className="px-2 pt-1 text-[10px] text-sky-300/80">+ {more} more</p>}
      </div>
      {(href || onManage) && (
        <button
          onClick={onManage}
          className="flex w-full items-center justify-center gap-1 border-t border-sky-400/20 py-2 text-[11px] font-semibold text-sky-300 transition-colors hover:bg-sky-400/10"
        >
          Manage integrations <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function AttentionGlassCard(props: {
  items: GlassAttention[];
  onOpen?: (item: GlassAttention) => void;
  href?: string;
}) {
  const { items, onOpen, href } = props;
  const visible = items.slice(0, 6);
  const more = items.length - visible.length;
  return (
    <div className="glass overflow-hidden rounded-2xl border-amber-400/30" style={{ background: 'linear-gradient(160deg, rgba(251,191,36,0.13) 0%, rgba(13,11,20,0.74) 45%, rgba(251,191,36,0.06) 100%)' }}>
      <div className="flex items-center gap-2 border-b border-amber-400/20 px-4 py-3">
        <TriangleAlert className="h-4 w-4 text-amber-300" />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">Needs your attention</p>
        <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200 tabular-nums">{items.length}</span>
      </div>
      <div className="space-y-1 px-3 py-3">
        {visible.length === 0 ? (
          <p className="flex items-center gap-2 px-2 py-3 text-[11px] text-gray-500">
            <Zap className="h-3.5 w-3.5" /> All clear &mdash; nothing waiting on you right now.
          </p>
        ) : (
          visible.map((it) => {
            const urgent = it.priority === 'urgent';
            return (
              <button
                key={it.id}
                onClick={() => onOpen?.(it)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-amber-400/15 bg-[#0d0b14]/70 px-3 py-2 text-left transition-colors hover:border-amber-400/30 hover:bg-amber-400/10"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${urgent ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-400/20 text-amber-300'}`}>
                  <TriangleAlert className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-amber-100">{it.title}</span>
                  <span className="block truncate text-[10px] text-amber-200/60">
                    {it.projectName ?? 'Task'} &middot; {it.priority} {it.kind ? `&middot; ${it.kind}` : ''}
                  </span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-300/70" />
              </button>
            );
          })
        )}
        {more > 0 && <p className="px-2 pt-1 text-[10px] text-amber-300/80">+ {more} more</p>}
      </div>
      {(href || onOpen) && (
        <a
          href={href}
          onClick={(e) => {
            if (onOpen && href) { e.preventDefault(); onOpen({ id: '__queue__', title: 'Attention queue', priority: '' }); }
          }}
          className="flex w-full items-center justify-center gap-1 border-t border-amber-400/20 py-2 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-400/10"
        >
          Review attention queue <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}