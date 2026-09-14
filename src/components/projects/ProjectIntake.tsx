'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileUp,
  FolderKanban,
  Files,
  Loader2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { Btn, Field, Input, Modal, Select, Spinner } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';

interface KnowledgeRow {
  id: string;
  title: string;
  kind: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
interface ProjectRow {
  id: string;
  name: string;
}
interface DocRow {
  id: string;
  name: string;
  folder?: string;
  kind?: string;
}

function fmtSize(b: number): string {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function ago(iso?: string): string {
  if (!iso) return 'just now';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return 'just now';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface SectionPart {
  heading?: string;
  text: string;
}

function parseContent(content: string): SectionPart[] {
  const parts: SectionPart[] = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      parts.push({ heading: m[1], text: '' });
    } else {
      const target = parts.length > 0 ? parts[parts.length - 1] : parts[0];
      if (target) target.text += (target.text ? '\n' : '') + line;
      else parts.push({ text: line });
    }
  }
  return parts;
}

export function ProjectIntake({
  projectId,
  compact,
  coreLabel,
}: {
  projectId?: string;
  compact?: boolean;
  coreLabel?: string;
}) {
  const projects = useCollection<ProjectRow>('projects', {});
  const knowledge = useCollection<KnowledgeRow>('knowledge', {});
  const docs = useCollection<DocRow>('documents', {});
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'new' | 'existing'>(projectId ? 'existing' : 'new');
  const [projName, setProjName] = useState('');
  const [projId, setProjId] = useState(projectId ?? '');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ projectId: string; name: string; created: boolean; files: number } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const briefings = useMemo(() => {
    const list = knowledge.rows.filter((k) => Array.isArray(k.tags) && k.tags.includes('intake'));
    return projectId ? list.filter((k) => k.tags.includes(projectId)) : list;
  }, [knowledge.rows, projectId]);

  const intakeFiles = useMemo(
    () => docs.rows.filter((d) => typeof d.folder === 'string' && d.folder.startsWith('intake-')),
    [docs.rows],
  );

  const submit = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f, f.name));
      fd.set('mode', mode);
      if (mode === 'new') fd.set('projectName', projName.trim());
      else fd.set('projectId', projId);
      const res = await fetch('/api/project-intake', { method: 'POST', body: fd });
      const d = (await res.json()) as {
        ok?: boolean;
        data?: { project: { id: string; name: string }; created: boolean; files: unknown[] };
        error?: { message?: string };
      };
      if (!res.ok || !d.ok) throw new Error(d.error?.message ?? 'Intake failed');
      const data = d.data as { project: { id: string; name: string }; created: boolean; files: unknown[] };
      if (data.created && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(`cdg.project.new.${data.project.id}`, '1');
        } catch {
          // ignore
        }
      }
      setDone({ projectId: data.project.id, name: data.project.name, created: data.created, files: data.files.length });
      setFiles([]);
      setProjName('');
      setOpen(false);
      setExpanded(null);
      projects.reload();
      knowledge.reload();
      docs.reload();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.startsWith('PLAN_LIMIT')) setErr('Plan limit reached. Archive or delete a project, or upgrade before accepting new files.');
      else setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#080a11]/50 p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-3 border-b border-white/5 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--c-accent-text)]">
          project intake{coreLabel ? ` · ${coreLabel}` : ''}
        </p>
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">
          {compact ? 'Phase · progress briefing' : 'Accept project files — a full briefing, as a phase'}
        </h2>
        <span className="ml-auto text-[10px] text-gray-500">
          every file type accepted · build a new project or add to an existing one · the system reads it and writes how it started, how it is going, what changed and when
        </span>
      </div>

      {done && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-4 py-3 text-xs">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
            <Check className="h-3.5 w-3.5" />
          </span>
          <p className="text-gray-200">
            <span className="font-bold text-white">{done.files}</span> file{done.files === 1 ? '' : 's'} accepted —
            <span className="font-bold text-emerald-300"> {done.created ? 'new project' : 'added to'} “{done.name}”</span>.
            A written progress briefing phase is ready below.
          </p>
          <button
            onClick={() => router.push(`/dashboard/projects/${done.projectId}`)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 font-bold text-emerald-200 hover:bg-emerald-400/20"
          >
            Open the project <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full lg:w-64 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--c-accent-border)] px-4 py-8 text-center transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(150deg, rgba(139,92,246,0.12), rgba(5,6,11,0.4))' }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border border-[var(--c-accent-border)] text-[var(--c-accent-text)] shadow-[var(--c-glow)]">
              <FileUp className="h-6 w-6" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--c-accent-text)]">Accept project files</span>
            <span className="text-[10px] leading-relaxed text-gray-500">
              PDF · DOCX · PPTX · XLSX · text · csv · html · images · anything
              <br />choose files, then pick a home for them
            </span>
          </button>
          {files.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5">
                  <Files className="h-3.5 w-3.5 shrink-0 text-[var(--c-accent-text)]" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-gray-200">{f.name}</span>
                  <span className="shrink-0 text-[10px] text-gray-600">{fmtSize(f.size)}</span>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="shrink-0 text-gray-600 hover:text-white" title="Remove">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {files.length > 0 && (
                <button
                  onClick={submit}
                  disabled={busy || (mode === 'existing' && !projId)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-accent-strong))' }}
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {busy ? 'Reading files…' : `Read ${files.length} file${files.length === 1 ? '' : 's'} → briefing`}
                </button>
              )}
              {err && <p className="text-[11px] text-rose-300">{err}</p>}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {knowledge.loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500"><Spinner /> Loading briefings…</div>
          ) : briefings.length === 0 ? (
            <div className="flex flex-col items-start justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-8 text-left">
              <p className="text-sm font-bold text-gray-200">No progress briefing yet.</p>
              <p className="text-xs leading-relaxed text-gray-500">
                Accept files from your computer — the system reads them, creates a new project or adds them to an existing one,
                then writes a briefing phase covering when it started, how it is going, and what changed and when.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {briefings.map((k) => {
                const open_ = expanded === k.id;
                const pid = k.tags.find((t) => projects.rows.some((p) => p.id === t));
                const pName = projects.rows.find((p) => p.id === pid)?.name;
                const fileCount = intakeFiles.filter((d) => d.folder === `intake-${pid}`).length;
                const parts = parseContent(k.content);
                const first = parts.filter((p) => p.text).map((p) => `${p.heading ?? 'Note'}: ${p.text.slice(0, 96)}`).slice(0, 2);
                return (
                  <div key={k.id} className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
                    <button
                      onClick={() => setExpanded(open_ ? null : k.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]">
                        <FolderKanban className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-gray-100">{k.title}</span>
                        <span className="block truncate text-[10px] text-gray-500">
                          {pName ? `project · ${pName}` : 'project briefing'} {fileCount > 0 ? `· ${fileCount} file${fileCount === 1 ? '' : 's'}` : ''} · {ago(k.updatedAt ?? k.createdAt)}
                        </span>
                      </span>
                      <span className="shrink-0 text-[var(--c-accent-text)]">
                        <ChevronDown className={`h-4 w-4 transition-transform ${open_ ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {!open_ && first.length > 0 && (
                      <div className="space-y-1 px-4 pb-3 pl-16">
                        {first.map((s, i) => (
                          <p key={i} className="text-[11px] leading-relaxed text-gray-500">{s}</p>
                        ))}
                      </div>
                    )}
                    {open_ && (
                      <div className="space-y-4 border-t border-white/5 px-4 py-4 pl-16 text-[11px] leading-relaxed text-gray-300">
                        {parts.map((p, i) => (
                          <div key={i}>
                            {p.heading && (
                              <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--c-accent-text)]">{p.heading}</p>
                            )}
                            <p className="whitespace-pre-wrap">{p.text}</p>
                          </div>
                        ))}
                        {pid && (
                          <button
                            onClick={() => router.push(`/dashboard/projects/${pid}`)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-3 py-1.5 text-[10px] font-bold text-[var(--c-accent-text)] hover:brightness-110"
                          >
                            Open flow <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Accept project files" wide>
        <div className="grid gap-3">
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            {(['new', 'existing'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                  mode === m ? 'bg-[var(--c-accent)] text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                {m === 'new' ? 'Create a new project' : 'Add to an existing project'}
              </button>
            ))}
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="*/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--c-accent-border)] bg-white/[0.02] px-4 py-6 text-center transition-colors hover:brightness-110"
          >
            <span className="text-xs font-bold text-[var(--c-accent-text)]">{files.length === 0 ? 'Choose files from your computer' : `${files.length} file${files.length === 1 ? '' : 's'} chosen — add more`}</span>
            <span className="text-[10px] text-gray-500">any file type · multiple files accepted</span>
          </button>

          {files.length > 0 && (
            <div className="max-h-44 space-y-1.5 overflow-auto rounded-lg border border-white/5 bg-white/[0.02] p-2">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg px-2 py-1">
                  <Files className="h-3.5 w-3.5 shrink-0 text-[var(--c-accent-text)]" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-gray-200">{f.name}</span>
                  <span className="shrink-0 text-[10px] text-gray-600">{fmtSize(f.size)}</span>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="shrink-0 text-gray-600 hover:text-white" title="Remove">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {mode === 'new' ? (
            <Field label="Project name">
              <Input value={projName} onChange={setProjName} placeholder="e.g. Q4 client delivery engine" />
            </Field>
          ) : (
            <Field label="Existing project">
              {projects.loading ? (
                <Spinner />
              ) : projects.rows.length === 0 ? (
                <p className="text-xs text-gray-500">No projects yet — create one first.</p>
              ) : (
                <Select value={projId} onChange={setProjId} options={projects.rows.map((p) => ({ label: p.name, value: p.id }))} />
              )}
            </Field>
          )}

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500">
              {files.length > 0 ? `${fmtSize(files.reduce((a, f) => a + f.size, 0))} total` : 'nothing selected yet'}
            </span>
            <div className="flex items-center gap-2">
              <Btn kind="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
              <Btn disabled={busy || files.length === 0 || (mode === 'existing' && !projId)} onClick={submit}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {busy ? 'Reading…' : 'Accept & write the briefing'}
              </Btn>
            </div>
          </div>
          {err && <p className="text-[11px] text-rose-300">{err}</p>}
        </div>
      </Modal>
    </section>
  );
}