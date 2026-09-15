import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles, ArrowRight, Eye, Check, ShieldCheck, MessagesSquare, Briefcase,
} from 'lucide-react';
import { ThemeScope } from '@/lib/theme';
import Preview from '@/components/landing/Preview';
import LiveDashboardPreview from '@/components/demo/LiveDashboardPreview';
import { SITE_PLANS } from '@/lib/plans';

const GUEST_PROJECTS = [
  { name: 'Website Relaunch', progress: 68, tone: '#9B6CFF', next: 'Prepare the Delgado approval so the spec review can be unblocked today.' },
  { name: 'Family Summer Plan', progress: 32, tone: '#20DDB1', next: 'Find the free week, draft the route proposal and the packing list.' },
  { name: 'Q3 Pipeline Push', progress: 51, tone: '#FF5A91', next: 'Draft the overdue follow-ups for the two deals paused on replies.' },
];

const GUEST_CHAT = [
  { who: 'you', text: 'What should I do first today?' },
  { who: 'ai', text: 'Good morning. The Delgado follow-up is the highest-impact move — prepare it now so it is ready for approval before 10:30. Notes and a draft reply are ready for you. Nothing is sent until you approve.' },
];

const GUEST_CONNECTIONS = ['Calendar', 'Mail', 'Messages', 'Drive', 'Meetings', 'Tasks'];

export default function DemoPage() {
  const plans = SITE_PLANS;
  return (
    <ThemeScope>
      <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white antialiased">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full opacity-25" style={{ background: "var(--c-accent)", filter: "blur(150px)" }} />
          <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full opacity-[0.18]" style={{ background: "var(--c-accent-strong)", filter: "blur(150px)" }} />
        </div>

        <div className="relative z-10">
          {/* Guest header */}
          <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#07060f]/85 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/cantdecide-gpt-logo.png" alt="CAN'T DECIDE GPT logo" width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
                <span className="text-sm font-black tracking-tight text-white sm:text-base">CAN&apos;T DECIDE GPT</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 sm:flex">
                  <Eye className="h-3 w-3" /> Guest mode — visual demo
                </span>
                <Link href="/login?mode=signup" className="rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-strong))" }}>
                  Start now
                </Link>
              </div>
            </nav>
          </header>

          <main className="mx-auto max-w-6xl px-5 pt-28 pb-10 sm:px-8">
            {/* Intro */}
            <section className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--c-accent-text)]">Guest demo</p>
              <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-black leading-tight text-white sm:text-5xl">
                This is the whole system, <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">visually.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                Nothing here performs real tasks — it is an example of what you will actually do after signing in. Every screen you are about to see is part of the real workspace, shown with sample data.
              </p>
            </section>

            {/* Dashboard overview */}
            <section className="mt-16">
              <ScreenLabel n="01" title="Your dashboard — one place for everything" />
              <div className="mt-5">
                <Preview showStats />
              </div>
            </section>

            {/* AI assistant */}
            <section className="mt-16">
              <ScreenLabel n="02" title="Ask the AI like you would ask a person" />
              <div className="glass mt-5 rounded-3xl p-5">
                <div className="space-y-3">
                  {GUEST_CHAT.map((m) => (
                    <div key={m.who + m.text} className={`flex ${m.who === 'you' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.who === 'you' ? 'border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] text-gray-100' : 'border border-white/10 bg-black/30 text-gray-200'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" /> The AI prepares — nothing is sent, booked, signed or paid without your approval.
                  </p>
                </div>
              </div>
            </section>

            {/* Projects */}
            <section className="mt-16">
              <ScreenLabel n="03" title="Projects — people, files, tasks and deadlines connected" />
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {GUEST_PROJECTS.map((p) => (
                  <div key={p.name} className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">{p.name}</p>
                      <Briefcase className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.tone }} />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">{p.progress}% complete</p>
                    <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-300">
                      <MessagesSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--c-accent-text)]" /> {p.next}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Connected services example:</p>
                {GUEST_CONNECTIONS.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-sky-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> {c}
                  </span>
                ))}
              </div>
            </section>

            {/* Live dashboard preview */}
            <section className="mt-16">
              <ScreenLabel n="04" title="Preview the dashboard — live, clickable, no account" />
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                This is the real dashboard running right here. Zoom the system map out and back in over every workflow, every tool
                and all three radial toolkits, open the project space, and hover the orbital tools. It behaves exactly like the pages
                you get after signing in.
              </p>
              <div className="mt-5">
                <LiveDashboardPreview />
              </div>
            </section>

            {/* Plans */}
            <section className="mt-16">
              <ScreenLabel n="05" title="Three tiers — every plan, its own toolkit" />
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div key={plan.id} className={`rounded-3xl border p-6 ${plan.featured ? 'border-[var(--c-accent-border)]' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold">{plan.name}</h3>
                      {plan.featured && (
                        <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">Best value</span>
                      )}
                    </div>
                    <p className="mt-2 text-3xl font-black">${plan.price.toLocaleString()}<span className="text-sm font-medium text-gray-500">{plan.cadence}</span></p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-200">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/dashboard/plans" className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background: plan.featured ? "linear-gradient(135deg, var(--c-accent), var(--c-accent-strong))" : "rgba(255,255,255,0.08)" }}>
                      See full plan <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section className="mt-20 text-center">
              <h2 className="mx-auto max-w-2xl text-2xl font-black text-white sm:text-4xl">
                Connect what matters. Understand what is next. Let AI help — keep human control.
              </h2>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/login?mode=signup" className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-[var(--c-glow)] transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-strong))" }}>
                  Start your workspace <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-8 py-3.5 text-sm font-bold text-gray-100 transition-colors hover:border-[var(--c-accent-border)]">
                  <Sparkles className="h-4 w-4" /> Back to the site
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </ThemeScope>
  );
}

function ScreenLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] text-xs font-black text-[var(--c-accent-text)]">{n}</span>
      <h2 className="text-lg font-black text-white sm:text-xl">{title}</h2>
    </div>
  );
}