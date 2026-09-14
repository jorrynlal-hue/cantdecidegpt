'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Handshake,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Search,
  CheckCircle2,
  Share2,
  Sparkles,
  Mail,
  Link2,
} from 'lucide-react';
import { board, WorkProfileView, ThreadView, DmThreadView } from '@/lib/core/client';
import { useSession } from '@/components/platform/SessionProvider';
import { Card, CardHeader, Badge, Btn, Input, Textarea, Select, Field, Empty, Modal, Spinner, fmtDateTime } from '@/components/platform/ui';

type Tab = 'browse' | 'register' | 'messages';

interface FormState {
  role: string;
  name: string;
  email: string;
  details: string;
  resume: string;
  socials: string;
  availability: string;
  fields: string[];
}

const initialForm: FormState = { role: 'finder', name: '', email: '', details: '', resume: '', socials: '', availability: '', fields: [] };

export default function BoardPage() {
  const { me } = useSession();

  // tabs + deep link
  const [tab, setTab] = useState<Tab>('browse');
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get('tab');
    if (t === 'messages' || t === 'register' || t === 'browse') {
      const id = window.setTimeout(() => setTab(t), 0);
      return () => window.clearTimeout(id);
    }
  }, []);

  // browse
  const [role, setRole] = useState<'all' | 'finder' | 'taker'>('all');
  const [field, setField] = useState('all');
  const [q, setQ] = useState('');
  const [profiles, setProfiles] = useState<WorkProfileView[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const loadProfiles = useCallback(() => {
    setLoadingProfiles(true);
    board
      .profiles({ role, field: field === 'all' ? '' : field, q })
      .then((d) => {
        setProfiles(d.profiles);
        setFields(d.fields);
      })
      .catch(() => setProfiles([]))
      .finally(() => setLoadingProfiles(false));
  }, [role, field, q]);

  useEffect(() => {
    const id = window.setTimeout(() => void loadProfiles(), 0);
    return () => window.clearTimeout(id);
  }, [loadProfiles]);

  // register tab
  const [myList, setMyList] = useState<WorkProfileView[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadMine = useCallback(() => {
    board
      .profiles({ mine: '1' })
      .then((d) => setMyList(d.profiles))
      .catch(() => setMyList([]));
  }, []);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  // messages
  const [threads, setThreads] = useState<ThreadView[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<DmThreadView | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadThreads = useCallback(() => {
    board
      .threads()
      .then((d) => setThreads(d.threads))
      .catch(() => setThreads([]));
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const openThread = useCallback(
    (id: string) => {
      setActiveThreadId(id);
      board
        .thread(id)
        .then((d) => {
          setActiveThread(d.thread);
          setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
        })
        .catch(() => setActiveThread(null));
    },
    []
  );

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || !activeThreadId || sending) return;
    setSending(true);
    try {
      await board.send(activeThreadId, text);
      setDraft('');
      const d = await board.thread(activeThreadId);
      setActiveThread(d.thread);
      loadThreads();
    } catch {
      // keep draft
    } finally {
      setSending(false);
    }
  }, [draft, activeThreadId, sending, loadThreads]);

  // connect flow
  const [connectTarget, setConnectTarget] = useState<WorkProfileView | null>(null);
  const [connectMsg, setConnectMsg] = useState('');
  const [connecting, setConnecting] = useState(false);

  const startConnect = (p: WorkProfileView) => {
    setConnectTarget(p);
    setConnectMsg(`Hi ${p.name.split(' ')[0]}, I found your profile on the work board and would love to talk about working together.`);
  };

  const confirmConnect = useCallback(async () => {
    if (!connectTarget || connecting) return;
    setConnecting(true);
    try {
      const r = await board.connect(connectTarget.id, connectMsg.trim() || undefined);
      setConnectTarget(null);
      await board.thread(r.thread.id).then((d) => setActiveThread(d.thread));
      setActiveThreadId(r.thread.id);
      loadThreads();
      setTab('messages');
    } catch (e) {
      setPageError((e as Error).message);
    } finally {
      setConnecting(false);
    }
  }, [connectTarget, connectMsg, connecting, loadThreads]);

  const unreadCount = threads.reduce((n, t) => n + t.unread, 0);

  const loadFormFrom = (p: WorkProfileView) => {
    setEditingId(p.id);
    setForm({
      role: p.role,
      name: p.name,
      email: p.email,
      details: p.details,
      resume: p.resume ?? '',
      socials: p.socials.join(', '),
      availability: p.availability ?? '',
      fields: p.fields,
    });
    setNotice(`Editing your ${p.role === 'finder' ? 'work finder' : 'work taker'} profile. Save when ready.`);
  };

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ ...initialForm, name: me?.user?.name ?? '', email: me?.user?.email ?? '' });
    setNotice(null);
  }, [me?.user?.name, me?.user?.email]);

  useEffect(() => {
    const id = window.setTimeout(() => resetForm(), 0);
    return () => window.clearTimeout(id);
  }, [resetForm]);

  async function saveProfile() {
    setSavingProfile(true);
    setNotice(null);
    setPageError(null);
    try {
      const payload = {
        role: form.role,
        name: form.name,
        email: form.email,
        details: form.details,
        resume: form.resume,
        socials: form.socials.split(',').map((s) => s.trim()).filter(Boolean),
        availability: form.availability,
        fields: form.fields,
      };
      if (editingId) await board.update(editingId, payload);
      else await board.create(payload);
      setNotice('Profile saved. You are now on the workboard.');
      setEditingId(null);
      loadMine();
      loadProfiles();
    } catch (e) {
      setPageError((e as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  const toggleField = (f: string) =>
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.includes(f) ? prev.fields.filter((x) => x !== f) : [...prev.fields, f],
    }));

  async function deleteProfile(id: string) {
    try {
      await board.remove(id);
      setMyList((l) => l.filter((p) => p.id !== id));
      loadProfiles();
      if (editingId === id) resetForm();
    } catch (e) {
      setPageError((e as Error).message);
    }
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'browse', label: 'Browse the workboard', icon: <Users className="h-4 w-4" /> },
    { id: 'register', label: 'Register my work', icon: <Plus className="h-4 w-4" /> },
    { id: 'messages', label: `Connect & chat${unreadCount ? ` (${unreadCount})` : ''}`, icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--c-accent-text)]">Human integrations</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Work finders & work takers</h1>
        <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
          One shared board. Register your field and your details, find the work or the people you need, then connect,
          chat and come to an agreement directly — even by voice.
        </p>
      </motion.div>

      {/* growth + plan banner */}
      <div className="mt-6 rounded-xl border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--c-accent-text)]" />
          <p className="text-sm text-gray-300">
            The workboard grows with every human that joins — the more finders and takers on one system, the faster you
            get work or workers. Share{' '}
            <span className="font-semibold text-[var(--c-accent-text)]">{'CAN’T DECIDE GPT'}</span> and become a valuable
            user now. Building a business? The <span className="font-semibold text-white">$1,600 plan</span> sets your
            customers up for you — that is $1,000s of setup on your side.
          </p>
          <a href="/dashboard/plans" className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--c-accent-border)] bg-black/30 px-3 py-1.5 text-xs font-semibold text-[var(--c-accent-text)] hover:bg-black/50">
            <Share2 className="h-3.5 w-3.5" /> Plans & growth
          </a>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]'
                : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {pageError ? (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{pageError}</p>
      ) : null}

      {/* browse */}
      {tab === 'browse' ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
              {(['all', 'finder', 'taker'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    role === r ? 'bg-[var(--c-accent)] text-[var(--c-accent-contrast)]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'Everyone' : r === 'finder' ? 'Work finders' : 'Work takers'}
                </button>
              ))}
            </div>
            <Select
              value={field}
              onChange={(v) => setField(v)}
              options={[{ label: 'All fields', value: 'all' }, ...fields.map((f) => ({ label: f, value: f }))]}
            />
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input value={q} onChange={setQ} placeholder="Search by name, field or details…" className="pl-9" />
            </div>
          </div>

          {loadingProfiles ? (
            <Spinner label="Loading the workboard…" />
          ) : profiles.length === 0 ? (
            <Empty title="No profiles here yet" hint="Be the first in this field — register your work and it will show here for every business and every worker." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                >
                  <Card className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-white">{p.name}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {p.role === 'finder' ? 'Work finder · available for work' : 'Work taker · building with people'}
                        </p>
                      </div>
                      <Badge tone={p.role === 'finder' ? 'purple' : 'blue'}>{p.role === 'finder' ? 'Finder' : 'Taker'}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.fields.map((f) => (
                        <Badge key={f} tone="gray">{f}</Badge>
                      ))}
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-400">{p.details}</p>
                    {p.resume && p.role === 'finder' ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">{p.resume}</p>
                    ) : null}
                    {p.availability ? (
                      <p className="mt-2 text-xs text-emerald-400">Available: {p.availability}</p>
                    ) : null}
                    <div className="mt-3 space-y-0.5 text-xs text-gray-500">
                      <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0 text-gray-600" /> {p.email}</p>
                      {p.socials.length ? <p className="flex items-center gap-1.5 truncate"><Link2 className="h-3 w-3 shrink-0 text-gray-600" /> {p.socials.join(' · ')}</p> : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[11px] text-gray-600">Joined {fmtDateTime(p.createdAt)}</span>
                      <Btn kind="primary" onClick={() => startConnect(p)}>
                        <Handshake className="h-3.5 w-3.5" /> Connect & chat
                      </Btn>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* register */}
      {tab === 'register' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <Card>
              <CardHeader
                title={editingId ? 'Edit your profile' : 'Register your work'}
                sub="A work finder lists the craft they are good at. A work taker lists the work their business needs."
              />
              <div className="space-y-4 p-5">
                <div className="flex gap-3">
                  <Btn
                    kind={form.role === 'finder' ? 'primary' : 'outline'}
                    onClick={() => setForm((f) => ({ ...f, role: 'finder' }))}
                  >
                    I&apos;m a work finder — I do work
                  </Btn>
                  <Btn
                    kind={form.role === 'taker' ? 'primary' : 'outline'}
                    onClick={() => setForm((f) => ({ ...f, role: 'taker' }))}
                  >
                    I&apos;m a work taker — I need people
                  </Btn>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Your name" />
                  </Field>
                  <Field label="Contact email">
                    <Input value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="you@example.com" type="email" />
                  </Field>
                </div>
                <Field label={form.role === 'finder' ? 'Your field — where you are good' : 'Field — what work you need'}>
                  <div className="flex flex-wrap gap-1.5">
                    {fields.map((f) => (
                      <button
                        key={f}
                        onClick={() => toggleField(f)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          form.fields.includes(f)
                            ? 'border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]'
                            : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={form.role === 'finder' ? 'What you offer' : 'What work you need doing'}>
                  <Textarea
                    rows={3}
                    value={form.details}
                    onChange={(v) => setForm((f) => ({ ...f, details: v }))}
                    placeholder={form.role === 'finder' ? 'What you deliver, your experience, results, how you like to work.' : 'Describe the projects, tasks or roles you are building and looking to fill.'}
                  />
                </Field>
                {form.role === 'finder' ? (
                  <Field label="Resume & extra details">
                    <Textarea
                      rows={3}
                      value={form.resume}
                      onChange={(v) => setForm((f) => ({ ...f, resume: v }))}
                      placeholder="Short resume: past work, skills, what you have delivered before."
                    />
                  </Field>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Socials (comma separated)">
                    <Input value={form.socials} onChange={(v) => setForm((f) => ({ ...f, socials: v }))} placeholder="LinkedIn, portfolio, X, GitHub…" />
                  </Field>
                  <Field label="Availability">
                    <Input value={form.availability} onChange={(v) => setForm((f) => ({ ...f, availability: v }))} placeholder="e.g. Immediate, evenings, part-time" />
                  </Field>
                </div>
                {notice ? (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {notice}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <Btn kind="primary" onClick={saveProfile} disabled={savingProfile || !form.details.trim()}>
                    {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {editingId ? 'Save changes' : 'Publish to the workboard'}
                  </Btn>
                  {editingId ? (
                    <Btn kind="ghost" onClick={resetForm}>
                      Cancel edit
                    </Btn>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Your registered profiles" sub="Everyone on the system sees these." />
              {myList.length === 0 ? (
                <Empty title="Nothing registered yet" hint="Register as a work finder in the field you are good at, or as a work taker — your profile appears on the board instantly." />
              ) : (
                <div className="space-y-3 p-4">
                  {myList.map((p) => (
                    <div key={p.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge tone={p.role === 'finder' ? 'purple' : 'blue'}>{p.role}</Badge>
                          <span className="text-sm font-semibold text-white">{p.name}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <Btn kind="ghost" small onClick={() => loadFormFrom(p)}>
                            <Pencil className="h-3 w-3" /> Edit
                          </Btn>
                          <Btn kind="danger" small onClick={() => deleteProfile(p.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Btn>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.fields.map((f) => (
                          <Badge key={f} tone="gray">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {/* messages */}
      {tab === 'messages' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader title="Connections & chats" sub="Every connect starts a direct thread here." />
            <div className="max-h-[520px] overflow-y-auto p-2">
              {threads.length === 0 ? (
                <Empty title="No conversations yet" hint="Open the workboard and press Connect & chat on any profile. The thread appears here and you talk directly — no middleman." />
              ) : (
                threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openThread(t.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      activeThreadId === t.id ? 'bg-[var(--c-accent-soft)]' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{t.withName}</span>
                      {t.unread > 0 ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--c-accent)] px-1.5 text-[11px] font-bold text-[var(--c-accent-contrast)]">
                          {t.unread}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-600">{fmtDateTime(t.lastAt)}</span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{t.lastMessage}</p>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="flex flex-col lg:col-span-3">
            {activeThread ? (
              <>
                <CardHeader
                  title={`Chat with ${activeThread.aId === me?.user?.id ? activeThread.bName : activeThread.aName}`}
                  sub="Direct professional conversation. Agree the work, the terms and next steps here."
                />
                <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 460 }}>
                  {activeThread.messages.length === 0 ? (
                    <Empty title="Say hello to start" />
                  ) : (
                    activeThread.messages.map((m) => {
                      const mine = m.from === me?.user?.id;
                      return (
                        <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                          <div
                            className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                              mine
                                ? 'bg-[var(--c-accent)] text-[var(--c-accent-contrast)]'
                                : 'border border-white/10 bg-white/[0.05] text-gray-200'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.text}</p>
                            <p className={`mt-1 text-[10px] ${mine ? 'opacity-70' : 'text-gray-500'}`}>{fmtDateTime(m.at)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-white/5 p-3">
                  <Textarea
                    rows={1}
                    value={draft}
                    onChange={setDraft}
                    placeholder="Write your message…"
                    className="max-h-24"
                  />
                  <Btn kind="primary" onClick={sendMessage} disabled={sending || !draft.trim()}>
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Btn>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <Empty title="Select a conversation" hint="Pick a thread on the left, or connect with someone on the workboard to start a new one." />
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* connect modal */}
      <Modal open={connectTarget !== null} onClose={() => setConnectTarget(null)} title={`Connect & chat — ${connectTarget?.name ?? ''}`}>
        <p className="mb-3 text-sm text-gray-400 text-[13px]">
          This opens a direct thread. Say hello, explain who you are, and start the conversation professionally — from here you can talk, agree and work together.
        </p>
        <Field label="First message">
          <Textarea rows={4} value={connectMsg} onChange={setConnectMsg} placeholder="Write your introduction…" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Btn kind="ghost" onClick={() => setConnectTarget(null)}>
            Cancel
          </Btn>
          <Btn kind="primary" onClick={confirmConnect} disabled={connecting || !connectMsg.trim()}>
            {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Handshake className="h-3.5 w-3.5" />}
            Connect & open chat
          </Btn>
        </div>
      </Modal>
    </div>
  );
}