'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  Check,
  CircleDot,
  FolderKanban,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { Btn, Empty, Field, Input, Modal, Select, Textarea } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { collection, plans } from '@/lib/core/client';
import { useTheme, getBrand } from '@/lib/theme';
import { OrbitalKits } from '@/components/projects/OrbitalKits';
import { SystemMapSection } from '@/components/projects/InfiniteSystemMap';
import { ProjectIntake } from '@/components/projects/ProjectIntake';

interface Project {
  id: string; name: string; description?: string; status: string; ownerId?: string;
  category?: string; colour?: string; tier?: string; template?: string;
  startDate?: string; deadline?: string; createdAt: string; updatedAt: string;
}
interface Task {
  id: string; projectId?: string; status: string; priority?: string; dueDate?: string;
  createdAt?: string; updatedAt?: string; title?: string;
}
interface Integration { id: string; name: string; status: string; category: string; key?: string; }

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'archived'];
const CATEGORIES = ['Business', 'Marketing', 'Sales & CRM', 'Customer', 'Finance', 'HR & Hiring', 'Operations', 'Website & Admin', 'Other'];
const TIERS = [
  { value: 'normal', label: 'Normal toolkit — $0' },
  { value: '1000', label: 'The $1,000 Special toolkit' },
  { value: '1600', label: 'The $1,600 Special toolkit' },
];
const TEMPLATES = ['Blank project', 'Client delivery', 'E-commerce ops', 'Time-block clarity', 'Approval flow', 'Launch week'];
const COLOURS = ['#8b5cf6', '#19c9d6', '#ff5a91', '#00d9b2', '#438bff', '#f5b544', '#fb7185', '#a3e635', '#ec4899', '#94a3b8'];

const PLAN_LIMITS: Record<string, number> = { essential: 3, pro: 5 };

const TIER_SHORT: Record<string, { label: string; color: string }> = {
  normal: { label: 'R01', color: '#19C9D6' },
  '1000': { label: 'R02 · $1k', color: '#FF5A91' },
  '1600': { label: 'R03 · $1.6k', color: '#9B6CFF' },
};

const DONE = new Set(['completed', 'cancelled', 'canceled', 'done', 'archived', 'closed']);

const ts = (v?: string) => {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return isNaN(t) ? 0 : t;
};

const agoStr = (iso?: string) => {
  const t = ts(iso);
  if (!t) return 'just now';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// organic constellation placement — objects drift in a loose river, not a grid
function place(i: number) {
  const per = 4;
  const row = Math.floor(i / per);
  const col = i % per;
  const x = 620 + col * 500 + (row % 2 === 1 ? 250 : 0) + ((col * 37) % 60);
  const y = 470 + row * 348 + ((i * 53) % 40);
  return { x, y };
}

const TICKER = '·';

export default function ProjectsOverview() {
  const router = useRouter();
  const { theme } = useTheme();
  const projects = useCollection<Project>('projects', {});
  const tasks = useCollection<Task>('tasks', {});
  const integrations = useCollection<Integration>('integrations', {});
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [activePlan, setActivePlan] = useState('pro');
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [category, setCategory] = useState('Other');
  const [colour, setColour] = useState(theme.accent);
  const [tier, setTier] = useState('normal');
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [deadline, setDeadline] = useState('');
  const [people, setPeople] = useState('');
  const [today, setToday] = useState(0);
  const [coreLabel] = useState(() => (typeof window === 'undefined' ? 'CDG' : getBrand()));

  useEffect(() => {
    plans.list().then((r) => setActivePlan(r.active)).catch(() => {});
  }, []);

  useEffect(() => {
    const t0 = setTimeout(() => setToday(Date.now()), 0);
    const iv = setInterval(() => setToday(Date.now()), 60000);
    return () => {
      clearTimeout(t0);
      clearInterval(iv);
    };
  }, []);

  const rows = useMemo(() => {
    let list = projects.rows.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (q && !(p.name + ' ' + (p.description ?? '')).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => ts(b.updatedAt ?? b.createdAt) - ts(a.updatedAt ?? a.createdAt));
    return list;
  }, [projects.rows, q, statusFilter, catFilter]);

  const stats = useMemo(() => {
    const m = new Map<string, { total: number; open: number; done: number; attention: number; running: number; waiting: number; last: number }>();
    tasks.rows.forEach((t) => {
      if (!t.projectId) return;
      const c = m.get(t.projectId) ?? { total: 0, open: 0, done: 0, attention: 0, running: 0, waiting: 0, last: 0 };
      c.total += 1;
      const isOpen = !DONE.has(t.status);
      if (isOpen) {
        c.open += 1;
        if (t.status === 'in_progress' || t.status === 'review') c.running += 1;
        else c.waiting += 1;
        const due = ts(t.dueDate);
        const overdue = today > 0 && due > 0 && due < today;
        if ((t.priority === 'urgent' || t.priority === 'high') || overdue) c.attention += 1;
      } else {
        c.done += 1;
      }
      c.last = Math.max(c.last, ts(t.updatedAt ?? t.createdAt));
      m.set(t.projectId, c);
    });
    return m;
  }, [tasks.rows, today]);

  const connectedList = useMemo(
    () => integrations.rows.filter((i) => i.status === 'connected' || i.status === 'configured'),
    [integrations.rows],
  );
  const connected = connectedList.length;

  const limit = PLAN_LIMITS[activePlan] ?? PLAN_LIMITS.pro;
  const used = projects.rows.length;
  const attentionTotal = projects.rows.reduce((acc, p) => acc + (stats.get(p.id)?.attention ?? 0), 0);
  const runningTotal = projects.rows.reduce((acc, p) => acc + (stats.get(p.id)?.running ?? 0), 0);

  const openForm = (p?: Project) => {
    if (p) {
      setEditTarget(p);
      setName(p.name); setDescription(p.description ?? ''); setStatus(p.status);
      setCategory(p.category ?? 'Other'); setColour(p.colour ?? theme.accent);
      setTier(p.tier ?? 'normal'); setTemplate(p.template ?? TEMPLATES[0]); setDeadline(p.deadline ?? '');
      setPeople((p as Project & { memberIds?: string[] }).memberIds?.join(', ') ?? '');
    } else {
      setEditTarget(null);
      setName(''); setDescription(''); setStatus('planning'); setCategory('Other');
      setColour(theme.accent); setTier('normal'); setTemplate(TEMPLATES[0]); setDeadline('');
      setPeople('');
    }
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const memberIds = people.split(',').map((s) => s.trim()).filter(Boolean);
      const body = {
        name: name.trim(), description: description || undefined, status,
        category, colour, tier, template, deadline: deadline || undefined,
        memberIds: memberIds.length ? memberIds : undefined,
      };
      if (editTarget) await collection.update('projects', editTarget.id, body);
      else {
        const created = (await collection.create('projects', body)) as { id?: string } | null | undefined;
        if (created?.id && typeof window !== 'undefined') {
          try { window.localStorage.setItem(`cdg.project.new.${created.id}`, '1'); } catch { /* ignore */ }
        }
      }
      setOpen(false);
      projects.reload();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.startsWith('PLAN_LIMIT')) {
        alert(`Plan limit reached — your plan allows up to ${limit} projects. Archive or delete one, or upgrade in Plans & Billing.`);
      } else {
        alert(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete project "${p.name}"? Tasks stay in the work queue but lose their project.`)) return;
    try {
      await collection.remove('projects', p.id);
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const setStat = async (p: Project, next: string) => {
    try {
      await collection.update('projects', p.id, { status: next });
      projects.reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const hubX = 1155;
  const boardH = Math.max(430 + Math.ceil(Math.max(1, rows.length) / 4) * 348 + 240, 560);
  const createDisabled = !editTarget && used >= limit;

  return (
    <div className="relative overflow-auto">
      <div className="relative min-w-[1640px]" style={{ height: boardH }}>
        {/* mission ticks — quiet system line */}
        <div className="absolute left-10 top-7 z-10 flex items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-gray-600">
          <span className="flex items-center gap-1.5 text-[#19C9D6]"><CircleDot className="h-3 w-3" /> system live</span>
          <span className="flex items-center gap-1.5 text-[#9B6CFF]"><Zap className="h-3 w-3" /> {runningTotal} running</span>
          <span className={`flex items-center gap-1.5 ${attentionTotal > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
            <TriangleAlert className={`h-3 w-3 ${attentionTotal > 0 ? 'animate-pulse' : ''}`} /> {attentionTotal} need attention
          </span>
          <span className="flex items-center gap-1.5 text-[#438BFF]"><Boxes className="h-3 w-3" /> {connected} services</span>
        </div>

        {/* floating controls — search + filters */}
        <div className="absolute right-8 top-5 z-20 w-72 rounded-xl border border-white/8 bg-[#080a11]/90 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the project space…"
              className="w-full rounded-lg border border-white/8 bg-[#05060b] py-1.5 pl-8 pr-2 text-xs text-white outline-none focus:border-[var(--c-accent-border)]"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {['all', ...PROJECT_STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${statusFilter === s ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] border border-[var(--c-accent-border)]' : 'border border-white/5 text-gray-500 hover:text-white'}`}
              >
                {s === 'all' ? 'all' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <button onClick={() => setCatFilter('all')} className={`rounded-full px-2 py-0.5 text-[10px] ${catFilter === 'all' ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]' : 'text-gray-500 hover:text-white'}`}>all cats</button>
            {CATEGORIES.slice(0, 4).map((c) => (
              <button key={c} onClick={() => setCatFilter(c)} className={`rounded-full px-2 py-0.5 text-[10px] ${catFilter === c ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]' : 'text-gray-500 hover:text-white'}`}>{c.toLowerCase()}</button>
            ))}
          </div>
        </div>

        {/* plan use tick */}
        <div className="absolute left-10 bottom-6 z-10 flex items-center gap-2 text-[10px] text-gray-600">
          <span className="uppercase tracking-[0.18em]">{activePlan === 'essential' ? '3' : '5'} max</span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%`, background: used >= limit ? '#fbbf24' : 'var(--c-accent)' }} />
          </div>
          <span className="tabular-nums">{used}/{limit}</span>
        </div>

        {/* constellation */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" width={1640} height={boardH}>
          {rows.map((p, i) => {
            const { x, y } = place(i);
            const st = stats.get(p.id);
            const needs = (st?.attention ?? 0) > 0;
            return (
              <path
                key={p.id}
                d={`M ${hubX} 150 C ${(hubX + x) / 2} 150, ${(hubX + x) / 2} ${y + 60}, ${x + 110} ${y + 60}`}
                fill="none"
                stroke={needs ? 'rgba(251,191,36,0.5)' : 'rgba(160,150,220,0.22)'}
                strokeWidth={1}
                strokeDasharray="3 6"
              />
            );
          })}
          <circle cx={hubX} cy={150} r={64} fill="none" stroke="rgba(139,92,246,0.35)" strokeWidth={1} strokeDasharray="4 5" className="jbos-breathe" />
          <circle cx={hubX} cy={150} r={90} fill="none" stroke="rgba(139,92,246,0.14)" strokeWidth={1} />
        </svg>

        {/* hub — create control */}
        <button
          onClick={() => (createDisabled ? alert(`Plan limit reached — ${used} of ${limit} projects. Upgrade in Plans & Billing to add more.`) : openForm())}
          className="absolute z-10 flex h-[120px] w-[120px] -translate-x-1/2 flex-col items-center justify-center rounded-full border border-[var(--c-accent-border)] text-center"
          style={{ left: hubX, top: 90, background: 'radial-gradient(120% 120% at 30% 25%, rgba(139,92,246,0.16), rgba(5,6,11,0.9) 80%)', boxShadow: '0 0 40px rgba(139,92,246,0.18)' }}
          title={createDisabled ? 'Plan limit reached' : 'Create a project'}
        >
          <Plus className="h-5 w-5 text-[var(--c-accent-text)]" />
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--c-accent-text)]">projects</span>
          <span className="text-[8px] uppercase tracking-[0.16em] text-gray-500">new project</span>
        </button>

        {/* project objects */}
        {rows.length === 0 ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Empty
              title="The project space is empty"
              hint="Create a project from the hub — every project becomes a floating work object connected into this map."
            />
          </div>
        ) : (
          rows.map((p, i) => {
            const { x, y } = place(i);
            const st = stats.get(p.id);
            const accent = p.colour || theme.accent;
            const progress = st && st.total > 0 ? Math.round((st.done / st.total) * 100) : 0;
            const attached = st?.total ?? 0;
            const needs = (st?.attention ?? 0) > 0;
            const tierMeta = TIER_SHORT[p.tier ?? 'normal'] ?? TIER_SHORT.normal;
            const isFocus = i === 0 && rows.some((r) => r.status === 'active') && p.status === 'active';
            return (
              <div
                key={p.id}
                className={`absolute flex ${needs ? 'z-30' : 'z-20'}`}
                style={{ left: x, top: y, width: 340, marginLeft: -170, marginTop: 0 }}
              >
                <div
                  className={`w-[340px] rounded-2xl border bg-[#080a11]/92 p-4 transition-colors ${needs ? 'border-amber-400/45' : 'border-white/8'} ${isFocus ? 'border-[var(--c-accent-border)]' : ''}`}
                  style={{ boxShadow: needs ? '0 0 26px rgba(251,191,36,0.16)' : isFocus ? `0 0 26px ${accent}22` : '0 6px 26px rgba(0,0,0,0.35)' }}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
                      style={{ borderColor: `${accent}66`, color: accent, background: `${accent}14` }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-main)]">{p.name}</p>
                      <p className="truncate text-[10px] text-gray-600">{p.category ?? 'Uncategorised'}{p.description ? ` · ${p.description.slice(0, 40)}` : ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-semibold" style={{ borderColor: `${tierMeta.color}55`, color: tierMeta.color }}>{tierMeta.label}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-[#00D9B2]' : p.status === 'on_hold' ? 'bg-amber-400' : p.status === 'completed' ? 'bg-[#438BFF]' : 'bg-gray-600'} ${needs ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>

                  {/* progress — thin line */}
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-600">
                    <span className="uppercase tracking-[0.14em]">{p.status.replace('_', ' ')}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: accent }} />
                    </div>
                    <span className="tabular-nums">{attached > 0 ? `${progress}% · ${st?.done ?? 0}/${attached}` : 'no tasks'}</span>
                  </div>

                  {/* work ticks */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                    <span className="flex items-center gap-1 text-[#9B6CFF]"><Zap className="h-3 w-3" /> {st?.running ?? 0} running</span>
                    <span className="flex items-center gap-1 text-gray-500"><Boxes className="h-3 w-3" /> {st?.waiting ?? 0} waiting</span>
                    <span className={`flex items-center gap-1 ${needs ? 'text-amber-400' : 'text-gray-500'}`}>
                      <TriangleAlert className={`h-3 w-3 ${needs ? 'animate-pulse' : ''}`} /> {st?.attention ?? 0} attention
                    </span>
                    <span className="flex items-center gap-1 text-[#438BFF]"><CircleDot className="h-3 w-3" /> {connected} services</span>
                  </div>

                  {/* meta */}
                  <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-gray-600">
                    <span>{p.template && p.template !== 'Blank project' ? p.template : 'blank'}<span className="mx-1">{TICKER}</span>{agoStr(st?.last ? new Date(st.last).toISOString() : p.updatedAt)}</span>
                    <span className="uppercase tracking-[0.12em]">since {fmtDate(p.createdAt)}</span>
                  </div>
                </div>

                {/* options */}
                <div className="absolute right-2 top-2 z-10">
                  <button
                    onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                    className="rounded-lg p-1 text-gray-600 hover:bg-white/10 hover:text-white"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {menuFor === p.id && (
                    <div className="absolute right-0 top-7 w-48 rounded-xl border border-white/10 bg-[#0c0e16] p-1 shadow-2xl">
                      {[
                        { icon: FolderKanban, label: 'Open flow', fn: () => router.push(`/dashboard/projects/${p.id}`) },
                        { icon: Pencil, label: 'Edit details', fn: () => openForm(p) },
                        { icon: Trash2, label: 'Delete project', fn: () => remove(p), danger: true },
                      ].map((it) => (
                        <button
                          key={it.label}
                          onClick={() => { setMenuFor(null); it.fn(); }}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs ${it.danger ? 'text-rose-300 hover:bg-rose-500/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                        >
                          <it.icon className="h-3.5 w-3.5" /> {it.label}
                        </button>
                      ))}
                      <div className="mt-1 border-t border-white/5 pt-1">
                        {PROJECT_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => { setMenuFor(null); setStat(p, s); }}
                            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-[11px] ${p.status === s ? 'text-[var(--c-accent-text)]' : 'text-gray-500 hover:bg-white/5'}`}
                          >
                            {p.status === s && <Check className="h-3 w-3" />}
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* free space — the three radial toolkits, viewable right here */}
      <section className="mt-8 rounded-2xl border border-white/5 bg-[#080a11]/50 p-4 lg:p-6">
        <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--c-accent-text)]">free space · radial toolkits</p>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">All three radial tool kits in the field</h2>
          <span className="ml-auto text-[10px] text-gray-500">Tier 1 CORE included · $1,000 PREMIUMS · $1,600 PRO PREMIUMS — hover a tool, open it, read what it is and how it helps.</span>
        </div>
        <OrbitalKits which="all" coreLabel={coreLabel} subtitle="System Intelligence Active" />
      </section>

      {/* project intake — accept a full project from the computer into a new or existing project */}
      <div className="mt-8">
        <ProjectIntake coreLabel={coreLabel} />
      </div>

      {/* system map — the same infinite view, in its own section on this page */}
      <SystemMapSection title="System map — zoom out over every workflow &amp; tool, then back in" />

      <Modal open={open} onClose={() => setOpen(false)} title={editTarget ? 'Edit project' : 'New project'} wide>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><Input value={name} onChange={setName} placeholder="e.g. Q4 client delivery engine" /></Field>
          <Field label="Category">
            <Select value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description"><Textarea value={description} onChange={setDescription} rows={2} placeholder="What does this project run?" /></Field>
          </div>
          <Field label="Radial toolkit">
            <Select value={tier} onChange={setTier} options={TIERS} />
          </Field>
          <Field label="Starting workflow">
            <Select value={template} onChange={setTemplate} options={TEMPLATES.map((t) => ({ label: t, value: t }))} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={setStatus} options={PROJECT_STATUSES.map((s) => ({ label: s.replace('_', ' '), value: s }))} />
          </Field>
          <Field label="People who can access (emails, comma separated)">
            <Input value={people} onChange={setPeople} placeholder="you@company.com, teammate@company.com" />
          </Field>
          <Field label="Deadline"><Input value={deadline} onChange={setDeadline} type="date" /></Field>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-gray-500">Project symbol colour</span>
            <div className="flex flex-wrap gap-2">
              {COLOURS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColour(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${colour === c ? 'scale-110 border-white' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {createDisabled && (
            <span className="text-[11px] text-amber-400">Plan limit reached — {used} of {limit} projects.</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Btn kind="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn kind="solid" disabled={busy || !name.trim() || createDisabled} onClick={save}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {editTarget ? 'Save changes' : 'Create project'}
            </Btn>
          </div>
        </div>
      </Modal>
      {menuFor && <div className="fixed inset-0 z-0" onClick={() => setMenuFor(null)} />}
    </div>
  );
}