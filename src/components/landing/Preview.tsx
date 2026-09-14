'use client';

import {
  Sparkles, Mail, CalendarDays, FolderOpen, FolderSearch, ArrowRight,
  ShieldCheck, Users, Bell, FileText, MessageSquare, Clock3, Check, AlertTriangle,
} from 'lucide-react';

const METRICS = [
  { label: 'Tasks today', value: '7', tone: 'text-[var(--c-accent-text)]' },
  { label: 'Messages need reply', value: '3', tone: 'text-sky-300' },
  { label: 'Next meeting', value: 'in 40m', tone: 'text-emerald-300' },
  { label: 'Blocked tasks', value: '2', tone: 'text-amber-300' },
  { label: 'AI items for review', value: '4', tone: 'text-[var(--c-accent-text)]' },
  { label: 'Project complete', value: '68%', tone: 'text-emerald-300' },
  { label: 'Missing document', value: '1', tone: 'text-amber-300' },
  { label: 'Approvals waiting', value: '3', tone: 'text-amber-300' },
];

const SERVICES = [
  { name: 'Calendar', tag: 'Google' },
  { name: 'Mail', tag: 'Gmail' },
  { name: 'Messages', tag: 'WhatsApp' },
  { name: 'Drive', tag: 'Google' },
  { name: 'Meetings', tag: 'Zoom' },
  { name: 'Tasks', tag: 'Notion' },
];

function Tiny({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 ${className}`}>{children}</span>;
}

export default function Preview({ showStats = false }: { showStats?: boolean }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-[var(--c-accent)]/[0.18] blur-3xl" />

      {/* Floating tags that name the real human-work elements */}
      <span className="absolute -top-3 left-6 z-20 hidden rounded-full border border-[var(--c-accent-border)] bg-[#0d0b18] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--c-accent-text)] shadow-lg md:block">
        Human task centre
      </span>
      <span className="absolute -bottom-3 right-8 z-20 hidden rounded-full border border-sky-400/30 bg-[#0b1220] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-sky-300 shadow-lg lg:block">
        Connected human services
      </span>

      {/* Window */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#100d1e]/90 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="mx-auto hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] text-gray-300 sm:flex">
            <Sparkles className="h-3 w-3 text-[var(--c-accent-text)]" />
            CAN&apos;T DECIDE GPT — human AI workspace
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          {/* Human task centre */}
          <div className="glass rounded-2xl p-3 md:col-span-1 md:row-span-2">
            <div className="flex items-center justify-between">
              <Tiny>Human task centre</Tiny>
              <span className="rounded-full bg-[var(--c-accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--c-accent-text)]">7 today</span>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {[
                { t: 'Approve client follow-up reply', tag: 'approval', tone: 'text-amber-300 border-amber-400/30' },
                { t: 'Send invoice to Delgado & Co', tag: 'today', tone: 'text-[var(--c-accent-text)] border-[var(--c-accent-border)]' },
                { t: 'Call mom re: Saturday visit', tag: 'today', tone: 'text-emerald-300 border-emerald-400/30' },
                { t: 'Draft Q3 project update', tag: 'today', tone: 'text-sky-300 border-sky-400/30' },
                { t: 'Pick up cake — bakery order', tag: 'today', tone: 'text-emerald-300 border-emerald-400/30' },
                { t: 'Reply to landlord email', tag: 'waiting', tone: 'text-amber-300 border-amber-400/30' },
                { t: 'Book dentist reminder', tag: 'today', tone: 'text-gray-400 border-white/10' },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${x.tone.split(' ')[0]}`} />
                  <span className="flex-1 truncate text-[11px] text-gray-200">{x.t}</span>
                  <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${x.tone}`}>{x.tag}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-2.5 py-2">
              <Sparkles className="h-3 w-3 shrink-0 text-[var(--c-accent-text)]" />
              <span className="text-[11px] font-semibold text-gray-100">Already tapered to today from your calendar, inbox and notes.</span>
            </div>
          </div>

          {/* AI assistant */}
          <div className="glass rounded-2xl p-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Tiny>AI assistant</Tiny>
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-rose-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> listening
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
              <div className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-tr-sm border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-3 py-2 text-[11px] text-gray-100">
                Ask the AI: &quot;what should I do first today?&quot;
              </div>
              <div className="w-fit max-w-[92%] rounded-2xl rounded-tl-sm border border-white/10 bg-black/30 px-3 py-2 text-[11px] leading-relaxed text-gray-200">
                Good morning. The Delgado follow-up is the highest-impact move — it is worth preparing now so it is ready for your approval before the 10:30. I&apos;ve pulled the notes and the draft reply for you.
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
                <Check className="h-3 w-3" /> 3 things prepared for review · nothing sent yet
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="glass rounded-2xl p-3 md:col-span-1">
            <div className="flex items-center justify-between">
              <Tiny>Connected calendar</Tiny>
              <CalendarDays className="h-3.5 w-3.5 text-sky-300" />
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-2">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-gray-100">Next meeting in 40 minutes — Q3 review</p>
                <p className="text-[9px] text-gray-500">Free blocks found: 2 today · suggested booking ready</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="glass rounded-2xl p-3 md:col-span-1">
            <div className="flex items-center justify-between">
              <Tiny>Messages needing reply</Tiny>
              <Mail className="h-3.5 w-3.5 text-sky-300" />
            </div>
            <ul className="mt-2 space-y-1.5">
              {[
                { n: 'Delgado & Co', p: 're: revised scope', on: 'awaiting you' },
                { n: 'Freelancer · Mina', p: 'deliverables summary', on: 'awaiting you' },
                { n: 'School notice', p: 'permission slip', on: 'auto-drafted' },
              ].map((m) => (
                <li key={m.n} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--c-accent-soft)] text-[8px] font-bold text-[var(--c-accent-text)]">{m.n[0]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-gray-100">{m.n}</p>
                    <p className="truncate text-[9px] text-gray-500">{m.p}</p>
                  </div>
                  <span className="shrink-0 text-[8px] font-semibold uppercase tracking-wider text-sky-300">{m.on}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Project progress */}
          <div className="glass rounded-2xl p-3 md:col-span-1">
            <div className="flex items-center justify-between">
              <Tiny>Project progress</Tiny>
              <Users className="h-3.5 w-3.5 text-[var(--c-accent-text)]" />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-gray-100">Website relaunch——68% complete</p>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: '68%', background: 'linear-gradient(90deg, var(--c-accent), #e883ff)' }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[9px] text-gray-500">
              <span>4 running · 2 blocked</span>
              <span className="flex items-center gap-1 text-amber-300"><AlertTriangle className="h-3 w-3" /> 1 waiting on person</span>
            </div>
          </div>

          {/* Files */}
          <div className="glass rounded-2xl p-3 md:col-span-1">
            <div className="flex items-center justify-between">
              <Tiny>Files &amp; documents</Tiny>
              <FolderOpen className="h-3.5 w-3.5 text-sky-300" />
            </div>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-center gap-2 text-[11px] text-gray-300"><FileText className="h-3 w-3 text-sky-300" /> Contract_v3_draft.pdf</li>
              <li className="flex items-center gap-2 text-[11px] text-gray-300"><FileText className="h-3 w-3 text-sky-300" /> Q3_pipeline_summary.md</li>
              <li className="flex items-center gap-2 text-[11px] text-amber-300"><FolderSearch className="h-3 w-3" /> 1 missing: signed NDA</li>
            </ul>
          </div>

          {/* Next best action */}
          <div className="rounded-2xl border border-[var(--c-accent-border)] p-3 md:col-span-1" style={{ background: 'linear-gradient(135deg, var(--c-accent-soft), rgba(0,0,0,0.2))' }}>
            <div className="flex items-center justify-between">
              <Tiny>Next best action</Tiny>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--c-accent-text)]" />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-gray-100">Prepare the Delgado follow-up reply</p>
            <p className="mt-1 text-[10px] leading-relaxed text-gray-400">Because the account is 2 weeks from renewal and the last note went unanswered.</p>
          </div>

          {/* Human approval */}
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.08] p-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Tiny className="text-amber-300">Human approval box</Tiny>
              <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-200">
              The AI prepared a reply to <span className="font-semibold text-white">Delgado &amp; Co</span> and a suggested calendar invite. Nothing is sent until you approve.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/20 px-2.5 py-1 text-[10px] font-bold text-amber-200"><Check className="h-3 w-3" /> Approve &amp; send</span>
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold text-gray-300">Edit first</span>
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold text-gray-300">Hold</span>
            </div>
            <div className="mt-2.5 flex items-start gap-1.5 text-[9px] text-gray-500">
              <Bell className="h-3 w-3 shrink-0" /> 3 approvals waiting across your day. The AI prepares — humans keep control.
            </div>
          </div>
        </div>

        {/* Connected human services strip */}
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Tiny>Connected ·</Tiny>
            {SERVICES.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-sky-200">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> {s.name} <span className="text-[8px] text-sky-400/70">· {s.tag}</span>
              </span>
            ))}
            <span className="ml-auto hidden items-center gap-1.5 text-[9px] text-gray-500 sm:flex">
              <MessageSquare className="h-3 w-3" /> Connect only what you need — start with one service
            </span>
          </div>
        </div>
      </div>

      {/* Real human outcomes — stat strip */}
      {showStats && (
        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {METRICS.map((m) => (
            <div key={m.label} className="glass rounded-xl px-2.5 py-2">
              <p className={`text-base font-black ${m.tone}`}>{m.value}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}