'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, BellRing, Check, ChevronDown, CircleDot, CornerDownLeft, Cpu, FolderOpen, Globe,
  HelpCircle, History, LayoutDashboard, LayoutTemplate, Layers, ListChecks, Loader2, Lock,
  LogOut, MoreHorizontal, Palette, Plug, Search, ShieldCheck, Users, Volume2, Workflow,
} from 'lucide-react';
import { useSession } from './SessionProvider';
import { search, notifications } from '@/lib/core/client';
import { CORE } from '@/lib/radial01';

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  kind: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

type Hit = { type: string; id: string; title: string; subtitle?: string; link: string; score: number };

export default function Header() {
  const router = useRouter();
  const { me, switchWorkspace, logout } = useSession();
  const [showPalette, setShowPalette] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPalette) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPalette(false);
      if (e.key === 'Enter' && hits[0]) {
        router.push(hits[0].link);
        setShowPalette(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPalette, hits, router]);

  useEffect(() => {
    if (!showPalette) return;
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setHits([]);
        return;
      }
      setSearching(true);
      try {
        const res = await search.q(q);
        setHits(res.hits.slice(0, 12));
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, showPalette]);

  const openNotifs = async () => {
    setShowNotifs((v) => !v);
    setNotifLoading(true);
    try {
      const list = await (await fetch('/api/db/notifications', { cache: 'no-store' })).json();
      const arr = (list as { data?: NotificationItem[] }).data ?? [];
      setNotifs(arr.slice(0, 10));
    } catch {
      setNotifs([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const markAll = async () => {
    await notifications.readAll();
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
  };

  const go = (link?: string) => {
    if (!link) return;
    setShowNotifs(false);
    router.push(link);
  };

  const activeWs = me?.workspaces.find((w) => w.id === me.activeWorkspaceId);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Three-dot quick menu */}
          <div className="relative">
            <button
              onClick={() => setShowQuick((v) => !v)}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Quick menu"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showQuick && (
              <div className="absolute left-0 mt-2 w-[340px] rounded-xl border border-white/10 bg-[#11111a] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <p className="text-xs font-semibold text-white">CAN&apos;T DECIDE GPT — Quick menu</p>
                  <span className="flex items-center gap-1 text-[10px] text-[#00D9B2]">
                    <CircleDot className="h-3 w-3" /> {CORE.short} live
                  </span>
                </div>
                <div className="max-h-[62vh] overflow-y-auto py-2">
                  {(
                    [
                      { label: 'Overview', items: [{ label: 'Overview', href: '/dashboard', icon: LayoutDashboard }] },
                      {
                        label: 'Build',
                        items: [
                          { label: 'Workflow Builder', href: '/dashboard/workspace', icon: Workflow },
                          { label: 'Radial Toolkits', href: '/dashboard/toolkits', icon: Layers },
                          { label: 'Tasks', href: '/dashboard/tasks', icon: ListChecks },
                          { label: 'Attention Required', href: '/dashboard/attention', icon: BellRing },
                        ],
                      },
                      {
                        label: 'Connected',
                        items: [
                          { label: 'Connected Apps', href: '/dashboard/integrations', icon: Plug },
                          { label: 'AI Services', href: '/dashboard/ai', icon: Cpu },
                          { label: 'Browsers and Websites', href: '/dashboard/website', icon: Globe },
                        ],
                      },
                      {
                        label: 'Data & History',
                        items: [
                          { label: 'Activity History', href: '/dashboard/activity', icon: History },
                          { label: 'Files and Data', href: '/dashboard/docs', icon: FolderOpen },
                          { label: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate },
                          { label: 'System Health', href: '/dashboard/trust', icon: ShieldCheck },
                        ],
                      },
                      {
                        label: 'Account & Help',
                        items: [
                          { label: 'Team and Permissions', href: '/dashboard/team', icon: Users },
                          { label: 'Appearance Settings', href: '/dashboard/settings', icon: Palette },
                          { label: 'Audio and Notifications', href: '/dashboard/settings', icon: Volume2 },
                          { label: 'Security and Privacy', href: '/dashboard/security', icon: Lock },
                          { label: 'Help and Keyboard Shortcuts', href: '/dashboard/help', icon: HelpCircle },
                        ],
                      },
                    ] as Array<{ label: string; items: Array<{ label: string; href: string; icon: typeof LayoutDashboard }> }>
                  ).map((group) => (
                    <div key={group.label} className="px-2 py-1">
                      <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">{group.label}</p>
                      {group.items.map((item) => (
                        <button
                          key={item.href + item.label}
                          onClick={() => {
                            setShowQuick(false);
                            router.push(item.href);
                          }}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                        >
                          <item.icon className="h-3.5 w-3.5 text-gray-500" />
                          <span className="flex-1 truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/5 p-2">
                  <button
                    onClick={() => {
                      setShowQuick(false);
                      router.push('/dashboard/radial');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[#19C9D6] hover:bg-white/5"
                  >
                    Normal radial 01 (24 tools) ›
                  </button>
                  <button
                    onClick={() => {
                      setShowQuick(false);
                      router.push('/dashboard/radial02');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[#FF5A91] hover:bg-white/5"
                  >
                    Premium radial 02 ($1,000) ›
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowPalette(true)}
            className="flex items-center gap-2 flex-1 max-w-md min-w-0 bg-[#12121a] border border-white/5 rounded-lg px-3 py-2 cursor-pointer hover:border-white/10 transition-colors"
          >
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-sm text-gray-500 truncate">Search anything...</span>
            <kbd className="hidden sm:inline-flex ml-auto items-center gap-0.5 text-[10px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5">
              <CornerDownLeft className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Workspace switcher */}
          <div className="relative">
            <button onClick={() => setWsOpen((v) => !v)} className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/10">
              <span className="font-medium">{activeWs?.name ?? 'Workspaces'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {wsOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#11111a] shadow-2xl py-1.5">
                {me?.workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setWsOpen(false);
                      if (w.id !== me.activeWorkspaceId) {
                        switchWorkspace(w.id).then(() => window.location.reload());
                      }
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                  >
                    <span className="flex-1 text-left">{w.name}</span>
                    {w.id === me.activeWorkspaceId && <Check className="w-4 h-4 text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button onClick={openNotifs} className="relative p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {me?.unread ? (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-purple-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {me.unread}
                </span>
              ) : null}
            </button>
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-[#11111a] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <p className="text-xs font-semibold text-white">Notifications</p>
                  <button onClick={markAll} className="text-[11px] text-purple-400 hover:text-purple-300">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading && <div className="py-6 text-center"><Loader2 className="w-4 h-4 animate-spin text-purple-400 mx-auto" /></div>}
                  {!notifLoading && notifs.length === 0 && <p className="py-8 text-center text-xs text-gray-600">Nothing here yet.</p>}
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => go(n.link)}
                      className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-white/5"
                    >
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${n.read ? 'bg-gray-700' : 'bg-purple-400'}`} />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-gray-200">{n.title}</span>
                        {n.body ? <span className="block text-[11px] text-gray-500 truncate">{n.body}</span> : null}
                        <span className="block text-[10px] text-gray-600 mt-0.5">{new Date(n.createdAt).toLocaleString()}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUser((v) => !v)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-sm font-semibold text-white hover:ring-2 hover:ring-purple-400/50 transition-all"
            >
              {(me?.user.name ?? '?').slice(0, 1).toUpperCase()}
            </button>
            {showUser && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#11111a] shadow-2xl py-1.5">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-sm font-medium text-white">{me?.user.name}</p>
                  <span className="text-sm text-gray-400">{me?.user.email}</span>
                  <span className="mt-1 inline-flex uppercase text-[10px] tracking-wider text-purple-300">{me?.user.role}</span>
                </div>
                <a href="/dashboard/settings" onClick={() => setShowUser(false)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-white/5">
                  Settings
                </a>
                <button onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-300 hover:bg-white/5">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command palette */}
      {showPalette && (
        <div className="fixed inset-0 z-50" onClick={() => setShowPalette(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            ref={paletteRef}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-auto mt-24 w-full max-w-xl rounded-xl border border-white/10 bg-[#11111a] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tasks, customers, documents, deals..."
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
              />
              {searching && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {hits.length === 0 && !searching && q.trim().length < 2 ? (
                <p className="px-4 py-6 text-xs text-gray-600">Type at least 2 characters to search your workspace.</p>
              ) : null}
              {hits.length === 0 && !searching && q.trim().length >= 2 ? (
                <p className="px-4 py-6 text-xs text-gray-600">No results for &quot;{q}&quot;.</p>
              ) : null}
              {hits.map((h) => (
                <button
                  key={`${h.type}-${h.id}`}
                  onClick={() => {
                    router.push(h.link);
                    setShowPalette(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-white/5"
                >
                  <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-purple-400">{h.type}</span>
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-200 truncate">{h.title}</span>
                    {h.subtitle ? <span className="block text-[11px] text-gray-500 truncate">{h.subtitle}</span> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* close popovers on outside click */}
      {(showNotifs || showUser || wsOpen || showQuick) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowNotifs(false);
            setShowUser(false);
            setWsOpen(false);
            setShowQuick(false);
          }}
        />
      )}
    </header>
  );
}