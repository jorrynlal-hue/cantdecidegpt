'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, Bot, BrainCircuit, CalendarCheck2, CalendarClock, ClipboardList, Copy, Database,
  Eye, FileText, FolderKanban, Gauge, Globe2, HeartHandshake, Home, Inbox, KeyRound, Layers,
  LinkIcon, Link2, Map, Megaphone, Minus, Monitor, Plus, Redo2, RotateCcw, Scale, Search,
  Settings, ShieldCheck, Sparkles, Target, Trash2, Truck, Undo2, Users, Wallet, Waypoints,
  Workflow, Wrench, X, type LucideIcon,
} from 'lucide-react';
import { BOARD_TOOLS, FAMILIES } from '@/lib/radial01';
import { PREMIUM_TOOLS, FAMILY_LABELS } from '@/lib/radial02';
import { useSession } from '@/components/platform/SessionProvider';

type NodeStatus = 'idle' | 'active' | 'done' | 'warn' | 'fail';
type KitId = 'normal' | 'prem' | 'op';

interface WNode {
  id: string;
  kit: KitId;
  toolId: string;
  name: string;
  icon: string;
  kind: string;
  desc: string;
  href: string;
  color: string;
  x: number;
  y: number;
  status: NodeStatus;
}

interface WEdge { a: string; b: string; }

const NODE_W = 132;
const NODE_H = 88;

const ICONS: Record<string, LucideIcon> = {
  Gauge, ShieldCheck, KeyRound, Settings, BrainCircuit, CalendarCheck2, FolderKanban, Workflow, Globe2,
  Database, Sparkles, Monitor, Truck, Wallet, Link2, Users, Megaphone, HeartHandshake, Target, BarChart3,
  FileText, Waypoints, Bot, Layers, ClipboardList, Inbox, Map, Home, Scale, CalendarClock, Wrench, Eye,
};

const STATUS_COLOR: Record<NodeStatus, string> = {
  idle: '#6b7280', active: '#3b82f6', done: '#22c55e', warn: '#f59e0b', fail: '#ef4444',
};

const KIT: Record<KitId, { label: string; color: string; price: string }> = {
  normal: { label: 'Normal toolkit', color: '#19C9D6', price: '$0' },
  prem: { label: '$1,000 premium', color: '#FF5A91', price: '$1,000' },
  op: { label: '$1,600 operator', color: '#9aa3b2', price: '$1,600' },
};

const ICON_OF = (icon: string): LucideIcon => ICONS[icon] ?? Eye;

const NORMAL_ITEMS = BOARD_TOOLS.map((t) => ({
  kit: 'normal' as KitId, toolId: t.id, name: t.name, icon: t.icon,
  kind: FAMILIES[t.family].label, desc: t.blurb, href: t.href, color: FAMILIES[t.family].color,
}));

const PREM_ITEMS = PREMIUM_TOOLS.map((t) => ({
  kit: 'prem' as KitId, toolId: t.id, name: t.name, icon: t.icon,
  kind: FAMILY_LABELS[t.family], desc: t.blurb, href: t.href, color: t.accent,
}));

interface Clamped { past: { nodes: WNode[]; edges: WEdge[] }[]; future: { nodes: WNode[]; edges: WEdge[] }[]; }

export default function WorkspacePage() {
  const { me } = useSession();
  const activeWs = me?.workspaces.find((w) => w.id === me.activeWorkspaceId);
  const [nodes, setNodes] = useState<WNode[]>(() => {
    try {
      const saved = window.localStorage.getItem('cdg.workspace.v1');
      if (saved) {
        const d = JSON.parse(saved) as { nodes: WNode[]; edges: WEdge[] };
        return d.nodes ?? [];
      }
    } catch { /* fall through */ }
    return [
      { id: 'starter-inbox', kit: 'prem', toolId: 'inbox', name: 'Inbox Triage', icon: 'Inbox', kind: 'Time', desc: 'Draft every reply, sort every thread.', href: '/dashboard/inbox', color: '#8D6CFF', x: 180, y: 300, status: 'active' },
      { id: 'starter-lifeadmin', kit: 'prem', toolId: 'lifeadmin', name: 'Life Admin', icon: 'ClipboardList', kind: 'Time', desc: 'Renewals, memberships, small print.', href: '/dashboard/lifeadmin', color: '#D94D8A', x: 520, y: 300, status: 'done' },
      { id: 'starter-recap', kit: 'prem', toolId: 'weeklyrecap', name: 'Weekly Recap', icon: 'CalendarClock', kind: 'Time', desc: 'A calm Sunday read of the week.', href: '/dashboard/weeklyrecap', color: '#5F8CFF', x: 860, y: 300, status: 'idle' },
      { id: 'starter-tasks', kit: 'normal', toolId: 'tasks', name: 'Tasks', icon: 'CalendarCheck2', kind: 'Work', desc: 'Task calendar and execution.', href: '/dashboard/tasks', color: '#438BFF', x: 340, y: 560, status: 'warn' },
    ];
  });
  const [edges, setEdges] = useState<WEdge[]>(() => {
    try {
      const saved = window.localStorage.getItem('cdg.workspace.v1');
      if (saved) {
        const d = JSON.parse(saved) as { nodes: WNode[]; edges: WEdge[] };
        return d.edges ?? [];
      }
    } catch { /* fall through */ }
    return [
      { a: 'starter-inbox', b: 'starter-lifeadmin' },
      { a: 'starter-lifeadmin', b: 'starter-recap' },
      { a: 'starter-inbox', b: 'starter-tasks' },
    ];
  });

  const [view, setView] = useState({ scale: 0.9, tx: 40, ty: 40 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [kitTab, setKitTab] = useState<KitId>('normal');
  const [q, setQ] = useState('');
  const [snap, setSnap] = useState<boolean>(true);
  const [groupMode, setGroupMode] = useState<boolean>(false);
  const [hist, setHist] = useState<Clamped>({ past: [], future: [] });
  const [toast, setToast] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const histRef = useRef(hist);
  const idSeq = useRef(1);
  const dragRef = useRef<{ id: string; cx: number; cy: number; nx: number; ny: number; moved: boolean } | null>(null);
  const panRef = useRef<{ cx: number; cy: number; tx: number; ty: number } | null>(null);

  useEffect(() => { nodesRef.current = nodes; edgesRef.current = edges; }, [nodes, edges]);
  useEffect(() => { histRef.current = hist; }, [hist]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Zoom: native non-passive listener so preventDefault works.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const scale = Math.max(0.25, Math.min(2, v.scale * factor));
        return { ...v, scale };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Keyboard: delete, undo/redo.

  const notice = (m: string) => setToast(m);

  const pushHistory = () => {
    setHist((h) => ({
      past: [...h.past.slice(-49), { nodes: nodesRef.current.map((n) => ({ ...n })), edges: edgesRef.current.map((e) => ({ ...e })) }],
      future: [],
    }));
  };

  const undo = () => {
    const h = histRef.current;
    if (h.past.length === 0) return;
    const prev = h.past[h.past.length - 1];
    setHist({ past: h.past.slice(0, -1), future: [...h.future, { nodes: nodesRef.current.map((n) => ({ ...n })), edges: edgesRef.current.map((e) => ({ ...e })) }] });
    setNodes(prev.nodes.map((n) => ({ ...n })));
    setEdges(prev.edges.map((e) => ({ ...e })));
  };

  const redo = () => {
    const h = histRef.current;
    if (h.future.length === 0) return;
    const next = h.future[h.future.length - 1];
    setHist({ past: [...h.past, { nodes: nodesRef.current.map((n) => ({ ...n })), edges: edgesRef.current.map((e) => ({ ...e })) }], future: h.future.slice(0, -1) });
    setNodes(next.nodes.map((n) => ({ ...n })));
    setEdges(next.edges.map((e) => ({ ...e })));
  };

  const toCanvas = (clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - view.tx) / view.scale, y: (clientY - rect.top - view.ty) / view.scale };
  };

  const addNode = (item: { kit: KitId; toolId: string; name: string; icon: string; kind: string; desc: string; href: string; color: string }) => {
    pushHistory();
    const c = toCanvas(window.innerWidth / 2, window.innerHeight / 2);
    const id = `${item.kit}-${item.toolId}-${(idSeq.current += 1)}`;
    setNodes((ns) => [
      ...ns,
      { id, kit: item.kit, toolId: item.toolId, name: item.name, icon: item.icon, kind: item.kind, desc: item.desc, href: item.href, color: item.color, x: c.x + (ns.length % 3) * 40, y: c.y + (ns.length % 2) * 40, status: 'idle' },
    ]);
    notice(`Added "${item.name}" to the canvas`);
  };

  const deleteNode = (id: string) => {
    if (!nodesRef.current.some((n) => n.id === id)) return;
    pushHistory();
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.a !== id && e.b !== id));
    setSelectedId((s) => (s === id ? null : s));
    setPendingFrom((p) => (p === id ? null : p));
    notice('Node removed');
  };

  const duplicateNode = (id: string) => {
    const n = nodesRef.current.find((x) => x.id === id);
    if (!n) return;
    pushHistory();
    const copy = { ...n, id: `${n.id}-copy-${(idSeq.current += 1)}`, x: n.x + 60, y: n.y + 60 };
    setNodes((ns) => [...ns, copy]);
    notice(`Duplicated "${n.name}"`);
  };

  const connect = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    if (edgesRef.current.some((e) => (e.a === fromId && e.b === toId) || (e.a === toId && e.b === fromId))) {
      notice('Already connected');
      return;
    }
    pushHistory();
    setEdges((es) => [...es, { a: fromId, b: toId }]);
    notice('Connected');
  };

  const removeEdge = (a: string, b: string) => {
    pushHistory();
    setEdges((es) => es.filter((e) => !(e.a === a && e.b === b) && !(e.a === b && e.b === a)));
  };

  const save = () => {
    localStorage.setItem('cdg.workspace.v1', JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current, ts: Date.now() }));
    notice('Sample workspace saved to this browser');
  };

  const restore = () => {
    try {
      const saved = localStorage.getItem('cdg.workspace.v1');
      if (!saved) { notice('No saved sample found'); return; }
      const d = JSON.parse(saved) as { nodes: WNode[]; edges: WEdge[] };
      pushHistory();
      setNodes(d.nodes ?? []);
      setEdges(d.edges ?? []);
      notice('Sample restored');
    } catch { notice('Could not restore'); }
  };

  const fit = () => {
    const ns = nodesRef.current;
    if (ns.length === 0) return;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pad = 80;
    const minX = Math.min(...ns.map((n) => n.x - NODE_W / 2));
    const maxX = Math.max(...ns.map((n) => n.x + NODE_W / 2));
    const minY = Math.min(...ns.map((n) => n.y - NODE_H / 2));
    const maxY = Math.max(...ns.map((n) => n.y + NODE_H / 2));
    const scale = Math.max(0.25, Math.min(1.5, Math.min((rect.width - pad * 2) / (maxX - minX || 1), (rect.height - pad * 2) / (maxY - minY || 1))));
    const tx = (rect.width - (maxX - minX) * scale) / 2 - minX * scale;
    const ty = (rect.height - (maxY - minY) * scale) / 2 - minY * scale;
    setView({ scale, tx, ty });
  };

  const setStatus = (id: string, status: NodeStatus) => {
    pushHistory();
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, status } : n)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' && selectedId) {
        deleteNode(selectedId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const selectedEdges = selected ? edges.filter((e) => e.a === selected.id || e.b === selected.id) : [];

  const edgePaint = (e: WEdge): { color: string; width: number } => {
    const a = nodes.find((n) => n.id === e.a);
    const b = nodes.find((n) => n.id === e.b);
    if (!a || !b) return { color: 'rgba(255,255,255,0.2)', width: 1.5 };
    if (a.status === 'fail' || b.status === 'fail') return { color: '#ef4444', width: 2.2 };
    if (a.status === 'warn' || b.status === 'warn') return { color: '#f59e0b', width: 2 };
    if (a.status === 'done' && b.status === 'done') return { color: '#22c55e', width: 2 };
    if (selected && (selected.id === a.id || selected.id === b.id)) return { color: a.kit === b.kit ? KIT[a.kit].color : '#a78bfa', width: 2.4 };
    if (a.status === 'active' || b.status === 'active') return { color: KIT[a.kit].color, width: 2 };
    return { color: 'rgba(255,255,255,0.28)', width: 1.5 };
  };

  const pathOf = (a: WNode, b: WNode) => {
    const p1x = a.x + NODE_W / 2; const p1y = a.y;
    const p2x = b.x - NODE_W / 2; const p2y = b.y;
    const dx = Math.max(40, (p2x - p1x) / 2);
    return { d: `M ${p1x} ${p1y} C ${p1x + dx} ${p1y}, ${p2x - dx} ${p2y}, ${p2x} ${p2y}`, p1x, p1y, p2x, p2y };
  };

  const kitItems = useMemo(() => {
    const all = kitTab === 'prem' ? PREM_ITEMS : NORMAL_ITEMS;
    if (!q.trim()) return all;
    return all.filter((i) => (i.name + ' ' + i.kind + ' ' + i.desc).toLowerCase().includes(q.toLowerCase()));
  }, [kitTab, q]);

  const kitSubset = useMemo(() => {
    const ids = nodes.map((n) => n.toolId);
    return ids;
  }, [nodes]);

  return (
    <div className="flex h-[calc(100vh-9.5rem)] min-h-[560px] flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-[#11151C] px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <LinkIcon className="h-4 w-4 text-[#19C9D6]" />
          <span className="max-w-[140px] truncate">{activeWs?.name ?? 'Workspace'}</span>
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] uppercase tracking-wider text-gray-500">
          Professional landscape · sample canvas
        </span>

        <div className="mx-1 h-5 w-px bg-white/10" />

        <button onClick={undo} title="Undo (Ctrl+Z)" className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white">
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </button>
        <button onClick={redo} title="Redo (Ctrl+Shift+Z)" className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white">
          <Redo2 className="h-3.5 w-3.5" /> Redo
        </button>

        <div className="mx-1 h-5 w-px bg-white/10" />

        <button onClick={save} className="flex items-center gap-1 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-400/15">
          <RotateCcw className="h-3.5 w-3.5" /> Save
        </button>
        <button onClick={restore} className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white">
          Restore
        </button>
        <button onClick={fit} title="Fit view" className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white">
          Fit
        </button>
        <button
          onClick={() => { setSnap((s) => !s); notice(snap ? 'Snap off' : 'Snap to grid on'); }}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] ${snap ? 'border-[#19C9D6]/30 bg-[#19C9D6]/10 text-[#19C9D6]' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
        >
          Grid snap
        </button>
        <button
          onClick={() => { setGroupMode((g) => !g); notice(groupMode ? 'Grouping off' : 'Grouping by toolkit on'); }}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] ${groupMode ? 'border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
        >
          Group
        </button>

        <div className="mx-1 h-5 w-px bg-white/10" />
        <Minus className="h-3.5 w-3.5 text-gray-400" />
        <button onClick={() => setView((v) => ({ ...v, scale: Math.max(0.25, v.scale - 0.1) }))} className="rounded border border-white/10 px-1.5 py-1 text-[10px] text-gray-300 hover:bg-white/5">−</button>
        <span className="text-[10px] text-gray-500 w-8 text-center font-mono">{Math.round(view.scale * 100)}%</span>
        <button onClick={() => setView((v) => ({ ...v, scale: Math.min(2, v.scale + 0.1) }))} className="rounded border border-white/10 px-1.5 py-1 text-[10px] text-gray-300 hover:bg-white/5">+</button>
        <Plus className="h-3.5 w-3.5 text-gray-400" />

        <div className="ml-auto flex items-center gap-2">
          {snap && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300 md:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Autosaved
            </span>
          )}
          <span className="hidden text-[10px] text-gray-600 sm:block">{nodes.length} nodes · {edges.length} links</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        {/* Canvas */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-white/5 bg-[#0B0F16]">
          {/* dotted grid */}
          <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(120,140,180,0.22) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div
            ref={viewportRef}
            className="absolute inset-0 cursor-grab touch-none"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('[data-node]')) return;
              panRef.current = { cx: e.clientX, cy: e.clientY, tx: view.tx, ty: view.ty };
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              setPendingFrom(null);
              setSelectedId(null);
            }}
            onPointerMove={(e) => {
              const c = toCanvas(e.clientX, e.clientY);
              setMouse(c);
              if (panRef.current) {
                setView((v) => ({
                  ...v,
                  tx: panRef.current!.tx + (e.clientX - panRef.current!.cx),
                  ty: panRef.current!.ty + (e.clientY - panRef.current!.cy),
                }));
              }
            }}
            onPointerUp={() => { panRef.current = null; }}
          >
            <div
              className="absolute top-0 left-0"
              style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: '0 0', width: 0, height: 0 }}
            >
              {/* Connections */}
              <svg className="absolute" style={{ width: 4000, height: 2600, left: -2000, top: -1300, overflow: 'visible' }} pointerEvents="none">
                {edges.map((e) => {
                  const a = nodes.find((n) => n.id === e.a);
                  const b = nodes.find((n) => n.id === e.b);
                  if (!a || !b) return null;
                  const { d, p1x, p1y, p2x, p2y } = pathOf(a, b);
                  const paint = edgePaint(e);
                  return (
                    <g key={`${e.a}-${e.b}`}>
                      <path d={d} fill="none" stroke={paint.color} strokeWidth={paint.width} opacity="0.85" />
                      <circle cx={p2x} cy={p2y} r={3} fill={paint.color} />
                      <circle cx={p1x} cy={p1y} r={3} fill={paint.color} opacity="0.6" />
                    </g>
                  );
                })}
              </svg>

              {/* Pending connection preview */}
              {pendingFrom && mouse && (() => {
                const from = nodes.find((n) => n.id === pendingFrom);
                if (!from) return null;
                return (
                  <svg className="absolute pointer-events-none" style={{ overflow: 'visible' }}>
                    <line x1={from.x + NODE_W / 2} y1={from.y} x2={mouse.x} y2={mouse.y} stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 4" />
                  </svg>
                );
              })()}

              {/* Nodes */}
              {nodes.map((n) => {
                const sel = selectedId === n.id;
                const Icon = ICON_OF(n.icon);
                return (
                  <div
                    key={n.id}
                    data-node
                    className="absolute z-10 select-none rounded-xl border bg-[#131a24] transition-shadow"
                    style={{
                      left: n.x, top: n.y,
                      width: NODE_W, height: NODE_H,
                      transform: 'translate(-50%,-50%)',
                      cursor: 'grab',
                      borderColor: sel ? n.color : groupMode ? n.color : 'rgba(255,255,255,0.1)',
                      boxShadow: sel
                        ? `0 0 18px ${n.color}44, inset 0 1px 0 rgba(255,255,255,0.06)`
                        : '0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                      opacity: q && !(n.name + n.kind).toLowerCase().includes(q.toLowerCase()) ? 0.25 : 1,
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      dragRef.current = { id: n.id, cx: e.clientX, cy: e.clientY, nx: n.x, ny: n.y, moved: false };
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      setSelectedId(n.id);
                    }}
                    onPointerMove={(e) => {
                      const d = dragRef.current;
                      if (!d || d.id !== n.id) return;
                      const dx = (e.clientX - d.cx) / view.scale;
                      const dy = (e.clientY - d.cy) / view.scale;
                      if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
                      setNodes((ns) => ns.map((x) => {
                        if (x.id !== d.id) return x;
                        const nx = d.nx + dx;
                        const ny = d.ny + dy;
                        return { ...x, x: snap ? Math.round(nx / 20) * 20 : nx, y: snap ? Math.round(ny / 20) * 20 : ny };
                      }));
                    }}
                    onPointerUp={() => {
                      if (dragRef.current?.moved) pushHistory();
                      dragRef.current = null;
                    }}
                  >
                    <div className="flex h-full flex-col p-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: n.color }} />
                        <span className="truncate text-[11px] font-semibold text-gray-100">{n.name}</span>
                        <span className="ml-auto h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_COLOR[n.status], boxShadow: `0 0 6px ${STATUS_COLOR[n.status]}` }} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[9px] leading-tight text-gray-500">{n.desc}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="rounded border border-white/10 px-1 py-px text-[8px] uppercase tracking-wider" style={{ color: n.color }}>{n.kind}</span>
                        <span className="text-[8px] uppercase tracking-wider" style={{ color: KIT[n.kit].color }}>{KIT[n.kit].price}</span>
                      </div>
                    </div>
                    {/* ports */}
                    <button
                      type="button"
                      title="Connect from here"
                      className="absolute top-1/2 -left-[7px] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-[#0B0F16] bg-purple-400/90 transition-transform hover:scale-125"
                      onPointerDown={(e) => { e.stopPropagation(); setPendingFrom(n.id); }}
                    />
                    <button
                      type="button"
                      title="Connect from the source node, then click here"
                      className="absolute top-1/2 -right-[7px] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-[#0B0F16] bg-cyan-400/90 transition-transform hover:scale-125"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        if (pendingFrom) { connect(pendingFrom, n.id); setPendingFrom(null); }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-gray-600">Canvas is empty — pick a toolkit on the right and add nodes.</p>
            </div>
          )}

          {toast && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-4 py-1.5 text-[11px] text-gray-200 backdrop-blur">
              {toast}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="flex w-[300px] shrink-0 flex-col rounded-xl border border-white/5 bg-[#11151C]">
          {/* Kit tabs */}
          <div className="flex border-b border-white/5">
            {(['normal', 'prem', 'op'] as KitId[]).map((k) => (
              <button
                key={k}
                onClick={() => setKitTab(k)}
                className={`flex-1 border-b-2 px-2 py-2.5 text-[11px] font-semibold transition-colors ${
                  kitTab === k ? 'border-current text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
                style={kitTab === k ? { color: KIT[k].color } : undefined}
              >
                {KIT[k].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search toolkit..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
            />
            {q && <button onClick={() => setQ('')} className="text-gray-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {kitTab === 'op' ? (
              <div className="mt-2 rounded-xl border border-dashed border-white/10 p-4 text-center">
                <p className="text-[11px] font-semibold text-gray-300">$1,600 · Operator toolkit</p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-gray-500">
                  Configuration pending. Nothing invented yet — the layout is ready so the exact feature set
                  drops in without a redesign.
                </p>
              </div>
            ) : kitItems.length === 0 ? (
              <p className="mt-4 text-center text-[10px] text-gray-600">No matching tools.</p>
            ) : (
              <div className="space-y-1">
                {kitItems.map((i) => {
                  const onCanvas = kitSubset.includes(i.toolId);
                  const Icon = ICON_OF(i.icon);
                  return (
                    <div key={`${i.kit}-${i.toolId}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: i.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-gray-200">{i.name}</span>
                        <span className="block truncate text-[9px] text-gray-600">{i.kind} · {i.desc}</span>
                      </span>
                      <button
                        onClick={() => addNode(i)}
                        title={`Add ${i.name} to canvas`}
                        className="rounded border border-white/10 p-1 text-gray-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {onCanvas && <span className="h-1.5 w-1.5 rounded-full" style={{ background: i.color }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inspector */}
          <div className="border-t border-white/5 p-3">
            {selected ? (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">Node details</p>
                  <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {(() => { const Icon = ICON_OF(selected.icon); return <Icon className="h-4 w-4" style={{ color: selected.color }} />; })()}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">{selected.name}</p>
                    <p className="text-[9px] text-gray-500">{KIT[selected.kit].label} · {selected.kind}</p>
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-3 text-[10px] leading-relaxed text-gray-500">{selected.desc}</p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] text-gray-500">Status:</span>
                  {(['idle', 'active', 'done', 'warn', 'fail'] as NodeStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(selected.id, s)}
                      className={`rounded-full border px-2 py-0.5 text-[9px] ${selected.status === s ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      style={selected.status === s ? { borderColor: STATUS_COLOR[s], background: `${STATUS_COLOR[s]}22` } : { borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <Link href={selected.href} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] font-medium text-gray-200 hover:bg-white/5">
                    <Eye className="h-3 w-3" /> Open workspace
                  </Link>
                  <button onClick={() => duplicateNode(selected.id)} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-gray-300 hover:bg-white/5">
                    <Copy className="h-3 w-3" /> Duplicate
                  </button>
                  <button onClick={() => deleteNode(selected.id)} className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1.5 text-[10px] font-medium text-rose-300 hover:bg-rose-500/15">
                    <Trash2 className="h-3 w-3" /> Delete node
                  </button>
                </div>

                {selectedEdges.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">Connections ({selectedEdges.length})</p>
                    <div className="mt-1 space-y-1">
                      {selectedEdges.map((e) => {
                        const other = nodes.find((n) => n.id === (e.a === selected.id ? e.b : e.a));
                        if (!other) return null;
                        return (
                          <div key={`${e.a}-${e.b}`} className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-white/5">
                            {(() => { const OIcon = ICON_OF(other.icon); return <OIcon className="h-3 w-3" style={{ color: other.color }} />; })()}
                            <span className="flex-1 truncate text-[10px] text-gray-300">{other.name}</span>
                            <button onClick={() => removeEdge(e.a, e.b)} className="text-gray-600 hover:text-rose-400"><X className="h-3 w-3" /></button>
                          </div>
                        );
                      })}
                      <button onClick={() => { pushHistory(); setEdges((es) => es.filter((e) => e.a !== selected.id && e.b !== selected.id)); notice('Links cleared'); }} className="text-[9px] text-gray-500 hover:text-gray-300">
                        Clear all links to this node
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">Inspector</p>
                <p className="mt-1.5 text-[10px] text-gray-600">
                  Select a node on the canvas to inspect it, change its sample status, open its workspace or remove it.
                </p>
                {pendingFrom && (
                  <button onClick={() => setPendingFrom(null)} className="mt-2 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-gray-400 hover:bg-white/5">
                    Cancel pending connection
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-[#11151C] px-3 py-2 text-[10px] text-gray-500">
        <span className="text-gray-400 font-medium">What connects · what runs · what needs attention:</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> normal ($0)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-400" /> premium ($1,000)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-500" /> operator ($1,600) — spec pending</span>
        <span className="mx-1 h-3 w-px bg-white/10" />
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> completed</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> warning</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> failed</span>
        <span className="ml-auto hidden text-[10px] text-gray-600 md:block">Drag nodes · connect via port dots · scroll to zoom · drag the background to pan · Ctrl+Z undo</span>
      </div>
    </div>
  );
}