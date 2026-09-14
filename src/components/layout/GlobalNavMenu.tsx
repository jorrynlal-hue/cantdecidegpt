'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Airplay,
  BarChart3,
  Bell,
  BellRing,
  Bot,
  Boxes,
  Brain,
  Briefcase,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronsRight,
  CircleDot,
  ClipboardList,
  Code,
  CreditCard,
  Crown,
  Cpu,
  FileText,
  Handshake,
  HeartHandshake,
  ImageIcon,
  Languages,
  LayoutDashboard,
  Layers,
  ListChecks,
  LogOut,
  Mail,
  Megaphone,
  MessageSquare,
  Mic,
  MoreHorizontal,
  PenTool,
  Plug,
  Radar,
  ScrollText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Users,
  Wallet,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  getBrand,
  hexRgba,
  useTheme,
} from '@/lib/theme';
import { CORE } from '@/lib/radial01';
import { useSession } from '@/components/platform/SessionProvider';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  prefix?: string;
}

export const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Home',
    items: [
      { label: 'Projects', href: '/dashboard/projects', icon: Briefcase, prefix: '/dashboard/projects' },
      { label: 'What are we doing today?', href: '/dashboard/command', icon: Zap },
      { label: 'Mission Control', href: '/dashboard/missioncontrol', icon: Airplay, prefix: '/dashboard/missioncontrol' },
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'System Map', href: '/dashboard/map', icon: Radar, prefix: '/dashboard/map' },
      { label: 'Tasks & Projects', href: '/dashboard/work', icon: ListChecks, prefix: '/dashboard/work' },
      { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar, prefix: '/dashboard/calendar' },
    ],
  },
  {
    label: 'Toolkits',
    items: [
      { label: 'Radial Board', href: '/dashboard/radial', icon: Radar, prefix: '/dashboard/radial' },
      { label: 'Premium Radial 02', href: '/dashboard/radial02', icon: Crown, prefix: '/dashboard/radial02' },
      { label: 'Special Radial 03', href: '/dashboard/radial03', icon: Crown, prefix: '/dashboard/radial03' },
      { label: 'Toolkit Tiers', href: '/dashboard/toolkits', icon: Layers, prefix: '/dashboard/toolkits' },
    ],
  },
  {
    label: 'Workflow Dashboard',
    items: [
      { label: 'Workflow Builder', href: '/dashboard/workspace', icon: Workflow, prefix: '/dashboard/workspace' },
      { label: 'Attention Required', href: '/dashboard/attention', icon: BellRing, prefix: '/dashboard/attention' },
    ],
  },
  {
    label: 'Work',
    items: [
      { label: 'Work Queue', href: '/dashboard/operations', icon: ClipboardList, prefix: '/dashboard/operations' },
      { label: 'Approval Center', href: '/dashboard/operations/approvals', icon: CheckSquare, prefix: '/dashboard/operations/approvals' },
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'AI Workforce', href: '/dashboard/workforce', icon: Bot, prefix: '/dashboard/workforce' },
      { label: 'Skills', href: '/dashboard/skills', icon: Brain, prefix: '/dashboard/skills' },
      { label: 'AI Studio', href: '/dashboard/ai', icon: Cpu, prefix: '/dashboard/ai' },
      { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare, prefix: '/dashboard/chat' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Human Workspace', href: '/dashboard/humans', icon: HeartHandshake, prefix: '/dashboard/humans' },
      { label: 'Team', href: '/dashboard/team', icon: Users, prefix: '/dashboard/team' },
      { label: 'Plans & Billing', href: '/dashboard/plans', icon: CreditCard, prefix: '/dashboard/plans' },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Business Overview', href: '/dashboard/platform', icon: Briefcase, prefix: '/dashboard/platform' },
      { label: 'CRM & Sales', href: '/dashboard/crm', icon: Users, prefix: '/dashboard/crm' },
      { label: 'Marketing', href: '/dashboard/marketing', icon: Megaphone, prefix: '/dashboard/marketing' },
      { label: 'Email', href: '/dashboard/email', icon: Mail, prefix: '/dashboard/email' },
      { label: 'Finance', href: '/dashboard/finance', icon: Wallet, prefix: '/dashboard/finance' },
      { label: 'Automation', href: '/dashboard/automation', icon: Workflow, prefix: '/dashboard/automation' },
      { label: 'Workspaces', href: '/dashboard/workspaces', icon: Boxes, prefix: '/dashboard/workspaces' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Code Generator', href: '/dashboard/code', icon: Code, prefix: '/dashboard/code' },
      { label: 'Image Generator', href: '/dashboard/image', icon: ImageIcon, prefix: '/dashboard/image' },
      { label: 'Summarizer', href: '/dashboard/summarize', icon: FileText, prefix: '/dashboard/summarize' },
      { label: 'Translator', href: '/dashboard/translate', icon: Languages, prefix: '/dashboard/translate' },
      { label: 'Writing Assistant', href: '/dashboard/writing', icon: PenTool, prefix: '/dashboard/writing' },
      { label: 'Data Analysis', href: '/dashboard/analyze', icon: BarChart3, prefix: '/dashboard/analyze' },
      { label: 'Voice-to-Text', href: '/dashboard/voice', icon: Mic, prefix: '/dashboard/voice' },
      { label: 'Documents', href: '/dashboard/docs', icon: FileText, prefix: '/dashboard/docs' },
      { label: 'Integrations', href: '/dashboard/integrations', icon: Plug, prefix: '/dashboard/integrations' },
      { label: 'Control Center', href: '/dashboard/control', icon: SlidersHorizontal, prefix: '/dashboard/control' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, prefix: '/dashboard/notifications' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Work Board', href: '/dashboard/board', icon: Handshake, prefix: '/dashboard/board' },
      { label: 'Opportunities', href: '/dashboard/marketplace', icon: Store, prefix: '/dashboard/marketplace' },
    ],
  },
  {
    label: 'Memory',
    items: [
      { label: 'Work Memory', href: '/dashboard/memory', icon: Brain, prefix: '/dashboard/memory' },
    ],
  },
  {
    label: 'Trust',
    items: [
      { label: 'Trust Center', href: '/dashboard/trust', icon: ShieldCheck, prefix: '/dashboard/trust' },
      { label: 'Policy Center', href: '/dashboard/operations/policies', icon: ShieldCheck, prefix: '/dashboard/operations/policies' },
      { label: 'Audit Ledger', href: '/dashboard/operations/audit', icon: ScrollText, prefix: '/dashboard/operations/audit' },
      { label: 'Measure & Learn', href: '/dashboard/operations/metrics', icon: Activity, prefix: '/dashboard/operations/metrics' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: SlidersHorizontal, prefix: '/dashboard/settings' },
    ],
  },
];

export function isActivePath(pathname: string, item: NavItem): boolean {
  return item.prefix
    ? pathname === item.href || pathname.startsWith(item.prefix)
    : pathname === item.href;
}

export function pageMeta(pathname: string): { label: string; icon: LucideIcon } {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (isActivePath(pathname, item)) return { label: item.label, icon: item.icon };
    }
  }
  return { label: 'Dashboard', icon: LayoutDashboard };
}

export default function GlobalNavMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { me, logout } = useSession();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const onOpenMenu = () => setOpen(true);
    window.addEventListener('cdg-open-menu', onOpenMenu);
    return () => window.removeEventListener('cdg-open-menu', onOpenMenu);
  }, []);

  const [brand] = useState(() => getBrand());

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return navGroups;
    return navGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => i.label.toLowerCase().includes(needle) || g.label.toLowerCase().includes(needle) || i.href.toLowerCase().includes(needle),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [q]);

  const glassSurface = `var(--glass-bg-strong)`;
  const menuShadow = `0 24px 80px -24px ${hexRgba(theme.accent, theme.glow / 200)}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open navigation menu"
        className={`p-2 rounded-lg border transition-colors ${
          open
            ? 'border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]'
            : 'border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] text-[var(--text-soft)] hover:text-white hover:border-[var(--c-accent-border)]'
        }`}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
              style={{ boxShadow: menuShadow, background: glassSurface, backdropFilter: 'blur(var(--glass-blur))', WebkitBackdropFilter: 'blur(var(--glass-blur))' }}
              className="absolute left-0 top-full mt-2 w-[min(400px,calc(100vw-16px))] rounded-2xl border border-[var(--glass-border)] overflow-hidden z-50"
            >
              {/* Menu header — live brand */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]/60" style={{ background: 'linear-gradient(90deg, var(--c-accent-soft), transparent 65%)' }}>
                <p className="text-xs font-semibold text-[var(--text-main)]">{brand}&apos;s menu</p>
                <span className="flex items-center gap-1.5 text-[10px] text-[var(--c-accent-text)]">
                  <span className="status-live h-1.5 w-1.5 rounded-full bg-[var(--c-accent)]" />
                  {CORE.short} live
                </span>
              </div>

              {/* Search */}
              <div className="px-3 pt-3">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--input-bg)] px-3 py-2">
                  <Search className="h-4 w-4 text-[var(--muted)]" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Filter everything…"
                    className="flex-1 bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--muted)]"
                  />
                </div>
              </div>

              {/* Groups */}
              <div className="max-h-[58vh] overflow-y-auto py-2 px-2">
                {filtered.length === 0 && (
                  <p className="px-3 py-8 text-center text-xs text-[var(--muted)]">Nothing matches &quot;{q}&quot;.</p>
                )}
                {filtered.map((group, gi) => {
                  const collapsed = closed[group.label] ?? gi !== 0;
                  return (
                    <div key={group.label} className="mb-0.5">
                      <button
                        onClick={() => setClosed((prev) => ({ ...prev, [group.label]: !collapsed }))}
                        className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] hover:text-[var(--text-soft)]"
                      >
                        <ChevronDown className={`h-3 w-3 transition-transform ${collapsed ? '-rotate-90' : 'rotate-0 text-[var(--c-accent-text)]'}`} />
                        <span className="flex-1 text-left">{group.label}</span>
                        <span className="text-[9px] font-normal normal-case tracking-normal text-[var(--muted)]">{group.items.length}</span>
                      </button>
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.16 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-0.5 pb-1">
                              {group.items.map((item) => {
                                const active = isActivePath(pathname, item);
                                const Icon = item.icon;
                                return (
                                  <button
                                    key={item.href}
                                    onClick={() => go(item.href)}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                                      active
                                        ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]'
                                        : 'text-[var(--text-soft)] hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[var(--c-accent-text)]' : 'text-[var(--muted)]'}`} />
                                    <span className="flex-1 truncate">{item.label}</span>
                                    {active && <ChevronsRight className="h-3.5 w-3.5 text-[var(--c-accent-text)]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--glass-border)]/60 p-1.5">
                <div className="grid grid-cols-2 gap-1.5 px-2 py-1.5">
                  <button onClick={() => go('/dashboard/radial')} className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-1.5 text-[10px] text-[#19C9D6] hover:bg-white/5">
                    <CircleDot className="h-3 w-3" /> Radial 01
                  </button>
                  <button onClick={() => go('/dashboard/radial02')} className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-1.5 text-[10px] text-[#FF5A91] hover:bg-white/5">
                    <CircleDot className="h-3 w-3" /> Radial 02
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-2 pb-1.5">
                  <button onClick={() => go('/dashboard/radial03')} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--c-accent-soft)] px-2 py-1.5 text-[10px] text-[var(--c-accent-text)] hover:bg-white/5">
                    <Crown className="h-3 w-3" /> Radial 03 — $1,600
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1 border-t border-[var(--glass-border)]/60 pt-1.5 px-2 pb-1.5">
                  <button onClick={() => go('/dashboard/settings')} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] text-[var(--text-soft)] hover:bg-white/5">
                    <SlidersHorizontal className="h-3 w-3" /> Settings
                  </button>
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                    <span className="rounded-full bg-[var(--c-accent-soft)] px-2 py-0.5 text-[var(--c-accent-text)] uppercase">{me?.user.role ?? 'guest'}</span>
                  </span>
                  <button onClick={logout} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] text-rose-300 hover:bg-white/5">
                    <LogOut className="h-3 w-3" /> Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .status-live { animation: livePulse 2.4s ease-in-out infinite; }
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--c-glow, 0 0 0 rgba(139,92,246,0)); }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}