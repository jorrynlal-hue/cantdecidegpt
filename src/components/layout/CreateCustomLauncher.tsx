'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Check,
  FolderKanban,
  Handshake,
  Loader2,
  MessagesSquare,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Btn, Field, Input, Modal, Spinner, Textarea } from '@/components/platform/ui';
import { useCollection } from '@/components/platform/data';
import { board } from '@/lib/core/client';

type Step = 'menu' | 'pair' | 'ai';

interface ProjectRow {
  id: string;
  name: string;
}
interface ThreadRow {
  id: string;
  withName: string;
  lastMessage?: string;
  profileId?: string;
}

interface AiResult {
  workspace: { id: string; name: string };
  tasks: Array<{ id: string; title: string }>;
  briefing: { id: string };
  tools: string[];
  provider: string;
}

export function CreateCustomLauncher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('menu');

  const projects = useCollection<ProjectRow>('projects', {});

  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [threadId, setThreadId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [pairing, setPairing] = useState(false);
  const [pairDone, setPairDone] = useState(false);
  const [pairErr, setPairErr] = useState<string | null>(null);

  const [aiDesc, setAiDesc] = useState('');
  const [aiName, setAiName] = useState('');
  const [building, setBuilding] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);

  const selThread = threadId || threads[0]?.id || '';
  const selProject = projectId || projects.rows[0]?.id || '';

  const openMenu = () => {
    setOpen(true);
    setStep('menu');
    setPairDone(false);
    setPairErr(null);
    setAiErr(null);
    setAiResult(null);
  };

  const openPair = () => {
    setStep('pair');
    setThreads([]);
    setPairDone(false);
    setPairErr(null);
    board
      .threads()
      .then((d) => setThreads(d.threads))
      .catch(() => setThreads([]));
  };

  const doPair = async () => {
    if (!selThread || !selProject || pairing) return;
    setPairing(true);
    setPairErr(null);
    try {
      await board.pair(selThread, selProject);
      setPairDone(true);
    } catch (e) {
      setPairErr((e as Error).message);
    } finally {
      setPairing(false);
    }
  };

  const doAI = async () => {
    if (!aiDesc.trim() || building) return;
    setBuilding(true);
    setAiErr(null);
    try {
      const res = await fetch('/api/ai/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDesc.trim(), name: aiName.trim() || undefined }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json?.error?.message ?? 'Something went wrong');
      setAiResult(json.data as AiResult);
      projects.reload();
    } catch (e) {
      setAiErr((e as Error).message);
    } finally {
      setBuilding(false);
    }
  };

  const glassBtn =
    'fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] backdrop-blur-xl transition-all hover:border-[var(--c-accent-border)] hover:bg-white/[0.1] hover:shadow-[0_0_32px_var(--c-accent)]';

  return (
    <>
      <button onClick={openMenu} className={glassBtn} aria-label="Find and create custom work">
        <Sparkles className="h-3.5 w-3.5 text-[var(--c-accent-text)]" />
        Create custom
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Create custom — find it, pair it, or build it" wide>
        {step === 'menu' ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => {
                setOpen(false);
                router.push('/dashboard/board');
              }}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--c-accent-border)] hover:bg-white/[0.06]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]">
                <Users className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-white">Workers &amp; helpers</span>
              <span className="text-xs leading-relaxed text-[var(--muted)]">
                Register yourself in your fields, or post the help you need. People from everywhere find you, chat, and show their works and socials.
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--c-accent-text)]">
                Go to the board <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <button
              onClick={openPair}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--c-accent-border)] hover:bg-white/[0.06]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]">
                <MessagesSquare className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-white">Pair help to a project</span>
              <span className="text-xs leading-relaxed text-[var(--muted)]">
                Take a connection you&apos;re already chatting with and drop them straight into one of your projects — they join, get a task, work gets done.
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--c-accent-text)]">
                Pair now <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <button
              onClick={() => setStep('ai')}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--c-accent-border)] hover:bg-white/[0.06]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]">
                <Bot className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-white">Create an AI employee</span>
              <span className="text-xs leading-relaxed text-[var(--muted)]">
                Describe the help you need in plain words. It builds you a personalised workspace — with the right tools, milestones and briefing — to do that exact job.
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--c-accent-text)]">
                Build it <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>
        ) : null}

        {step === 'pair' ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Pick a conversation you&apos;ve already started with someone on the work board, and a project to bring them into. They join
              that project as a member, a task slot opens for them, and the chat stays live.
            </p>

            {pairDone ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div>
                  <p className="text-sm font-bold text-emerald-200">Paired — they are in the project now.</p>
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push(`/dashboard/projects/${selProject}`);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-400/20"
                  >
                    <FolderKanban className="h-3.5 w-3.5" /> Open the project
                  </button>
                </div>
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
                You have no work board connections yet. Connect &amp; chat with someone first, then pair them into a project from here.
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push('/dashboard/board');
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--c-accent-text)] hover:brightness-110"
                >
                  <Users className="h-3.5 w-3.5" /> Open the work board
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Connection to bring in">
                  <select
                    value={selThread}
                    onChange={(e) => setThreadId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0c14] px-3 py-2 text-sm text-white outline-none focus:border-[var(--c-accent-border)]"
                  >
                    {threads.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.withName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Project to bring them into">
                  {projects.loading ? (
                    <Spinner />
                  ) : projects.rows.length === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[var(--muted)]">
                      No projects yet — create one first, or build one with the AI employee.
                    </div>
                  ) : (
                    <select
                      value={selProject}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0a0c14] px-3 py-2 text-sm text-white outline-none focus:border-[var(--c-accent-border)]"
                    >
                      {projects.rows.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
            )}

            {pairErr ? <p className="text-sm text-rose-300">{pairErr}</p> : null}

            {!pairDone && threads.length > 0 ? (
              <div className="flex justify-end">
                <Btn kind="primary" onClick={doPair} disabled={pairing || !selThread || !selProject}>
                  {pairing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Handshake className="h-3.5 w-3.5" />}
                  Pair into the project
                </Btn>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 'ai' ? (
          <div className="space-y-4">
            {aiResult ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                  <Bot className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <div>
                    <p className="text-sm font-bold text-emerald-200">Your AI employee built &quot;{aiResult.workspace.name}&quot;.</p>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-200/70">
                      {aiResult.tasks.length} milestone tasks set · briefing saved to your knowledge · {aiResult.tools.length} tools chosen ·
                      planned by {aiResult.provider}.
                    </p>
                  </div>
                </div>

                {aiResult.tools.length ? (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">Tools on this workspace</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.tools.map((t) => (
                        <span key={t} className="rounded-full border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--c-accent-text)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">Milestones set as tasks</p>
                  <div className="space-y-1.5">
                    {aiResult.tasks.map((t, i) => (
                      <div key={t.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-gray-200">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--c-accent-soft)] text-[10px] font-bold text-[var(--c-accent-text)]">
                          {i + 1}
                        </span>
                        {t.title}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Btn kind="ghost" onClick={() => setStep('menu')}>
                    Done
                  </Btn>
                  <Btn
                    kind="primary"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/dashboard/projects/${aiResult.workspace.id}`);
                    }}
                  >
                    <Zap className="h-3.5 w-3.5" /> Open the workspace
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-[var(--muted)]">
                  Tell it, in plain words, the kind of help you need. The AI employee reads your request, picks the right tools on the
                  system, and builds a personalised workspace — project, milestone tasks and briefing — made to finish that exact job.
                </p>
                <Field label="What help do you need?">
                  <Textarea
                    rows={5}
                    value={aiDesc}
                    onChange={setAiDesc}
                    placeholder="e.g. Build my online shop, set up the product pages, connect payments, and write the welcome email sequence — and launch it by the end of the month."
                  />
                </Field>
                <Field label="Name your workspace (optional)">
                  <Input value={aiName} onChange={setAiName} placeholder="e.g. My online shop launch" />
                </Field>
                {aiErr ? <p className="text-sm text-rose-300">{aiErr}</p> : null}
                <div className="flex justify-end">
                  <Btn kind="primary" onClick={doAI} disabled={building || !aiDesc.trim()}>
                    {building ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {building ? 'Building your workspace…' : 'Build my personalised workspace'}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step !== 'menu' ? (
          <button onClick={() => setStep('menu')} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-white">
            <X className="h-3 w-3" /> Back to options
          </button>
        ) : null}
      </Modal>
    </>
  );
}