"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Play,
  Check,
  X,
  Brain,
  Users,
  Mail,
  CalendarDays,
  ListTodo,
  FolderOpen,
  MessageSquare,
  ShieldCheck,
  Plug,
  Zap,
  Clock3,
  FileText,
  Home,
  Briefcase,
  GraduationCap,
  Plane,
  ShoppingCart,
  Wallet,
  HeartPulse,
  Building2,
  Target,
  Activity,
  Eye,
  SlidersHorizontal,
  Lock,
  History,
  Unplug,
  Settings,
  Star,
  Quote,
  ChevronDown,
  Bell,
  Rocket,
  CheckCircle2,
  Handshake,
  Mic,
  Map,
  Orbit,
  FolderKanban,
} from "lucide-react";
import { ThemeScope } from "@/lib/theme";
import Preview from "@/components/landing/Preview";

const fadeInUp = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={fadeInUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--c-accent-text)]">{kicker}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h2>
      {sub ? <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">{sub}</p> : null}
    </Reveal>
  );
}

function CTA({ href, children, kind = "primary", className = "" }: { href: string; children: ReactNode; kind?: "primary" | "outline"; className?: string }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold transition-all";
  if (kind === "outline") {
    return (
      <Link
        href={href}
        className={`${base} border border-[var(--glass-border)] bg-white/[0.04] text-gray-100 backdrop-blur hover:border-[var(--c-accent-border)] hover:bg-white/[0.07] ${className}`}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} text-white shadow-[var(--c-glow)] transition-all hover:brightness-110 hover:shadow-[0_0_32px_var(--c-accent)] ${className}`}
      style={{ background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-strong))" }}
    >
      {children}
    </Link>
  );
}

const NAV = [
  { label: "What this is", href: "#what" },
  { label: "Human integrations", href: "#integrations" },
  { label: "How it works", href: "#how" },
  { label: "Projects", href: "#projects" },
  { label: "Trust", href: "#trust" },
  { label: "Reviews", href: "#reviews" },
];

// ------------------------------------------------------------------ use cases
const USECASES = [
  { id: "today", icon: ListTodo, title: "Show me what I need to do today.", ex: "The AI pulls your calendar, reminders, open tasks and unread messages, then builds one honest list for today — with the two most important moves at the top, in plain words." },
  { id: "reply", icon: Mail, title: "Find the messages that need a reply.", ex: "It scans your inbox and chat channels, groups them by who is actually waiting on you, and drafts candidate replies for your approval. Nothing is sent on its own." },
  { id: "plan", icon: Target, title: "Make a plan for my project.", ex: "From your project notes, files and tasks, the AI drafts a plan: what is next, what is blocking, who does what, and the first three steps to take." },
  { id: "delayed", icon: Clock3, title: "Tell me what is delayed.", ex: "It compares deadlines across tasks, calendar and the promises found in messages, then lists exactly what is late or at risk — and what it needs to get moving again." },
  { id: "docs", icon: FolderOpen, title: "Organise these documents.", ex: "It finds the files, names what each one is, groups them by project, and flags the one that is missing before it becomes a problem." },
  { id: "meeting", icon: CalendarDays, title: "Find a meeting time for everyone.", ex: "It looks at the connected calendars, finds the overlapping free time, prepares the invite with a note per person, and reminds you to approve it before it is sent." },
  { id: "prepare", icon: MessageSquare, title: "Prepare a reply but don\u2019t send it.", ex: "The draft is created from your notes and past replies, shown for your review only — it is never sent until you approve it." },
  { id: "remind", icon: Bell, title: "Remind me about this next week.", ex: "It turns the note into a real reminder on your calendar, sets the follow-up task, and reads it back in next week\u2019s briefing." },
  { id: "waiting", icon: Users, title: "Show me what is waiting for another person.", ex: "It tracks open items split by owner — everything someone owes you or you owe them — so nobody silently gets stuck." },
  { id: "day", icon: Home, title: "Help me plan my work and personal day.", ex: "It combines work blocks with home errands, appointments and family reminders into one realistic day, with the important thing protected." },
  { id: "first", icon: Zap, title: "Tell me what I should do first.", ex: "It ranks today\u2019s list by impact, urgency and who is waiting — and explains, in a sentence, why that first move matters most." },
  { id: "change", icon: Activity, title: "Summarise what changed in my project.", ex: "It writes a short \u201Cwhat changed, what needs you, what is next\u201D update from tasks, messages, files and your calendar." },
];

// ------------------------------------------------------------------ projects
const PROJECTS = [
  {
    name: "Website Relaunch", progress: 68, running: 4, blocked: 2, people: ["You", "Mina", "Ravi"],
    files: 5, services: "Calendar · Drive · Tasks · Mail",
    next: "Prepare the Delgado approval so Ravi\u2019s spec review can be unblocked today.", tone: "#9B6CFF",
  },
  {
    name: "Family Summer Plan", progress: 32, running: 2, blocked: 0, people: ["You", "Partner"],
    files: 3, services: "Calendar · Messages",
    next: "Find the free week, draft the route proposal and the packing list.", tone: "#20DDB1",
  },
  {
    name: "Q3 Pipeline Push", progress: 51, running: 6, blocked: 1, people: ["You", "Team of 4"],
    files: 9, services: "Mail · CRM · Calendar · Drive",
    next: "Draft the overdue follow-ups for the two deals paused on replies.", tone: "#FF5A91",
  },
];

// ------------------------------------------------------------------ faq / hard questions
const HARD = [
  { q: "Is my data safe if I connect my services?", a: "You choose what to connect and what the AI can access. Every connected service can be disconnected at any time, permissions can be changed, and the system shows what it did and why. You always remain the owner of your data and projects." },
  { q: "Can it touch my money or send things without asking?", a: "No. Financial, legal and contractual actions are hard-gated: the AI prepares, organises and recommends — you approve before anything moves. Nothing is sent, booked, signed or paid on its own." },
  { q: "I\u2019m not technical. Is this for me?", a: "Yes. The default experience is simple: see your day, your tasks, your messages, your meetings, your files and your next action. The advanced controls exist, but you never have to look at workflows, automation or AI settings if you don\u2019t want to." },
  { q: "Is this just ChatGPT with a nicer dashboard?", a: "No. Answering questions is a small part. The point is connecting the real services you already use and moving the work forward: preparing replies for your approval, rescheduling meetings, unblocking tasks, organising files, and showing what is next." },
  { q: "What if I connect everything and regret it?", a: "You don\u2019t have to connect everything, and you can always undo. Services can be disconnected any time, permissions changed any time, and the full activity history stays visible so you can check what happened." },
  { q: "Does the AI replace people or jobs — including mine?", a: "No. The AI removes the heavy, repetitive work so humans can spend their time on the human parts: judgement, relationships, decisions and the work that needs a person. People decide — AI carries the load." },
  { q: "Can it handle my personal life and my business?", a: "Yes — that is the whole idea. One connected place for family planning, learning, appointments and household tasks on one side, and your projects, clients, team and business work on the other." },
  { q: "Do I have to start with everything?", a: "No. Start with one useful connection — a calendar, an inbox or a project. The system grows with you, and only when you need it." },
];

// ------------------------------------------------------------------ reviews
const REVIEWS = [
  {
    name: "Jane M.", role: "Consultant · small practice + family", rating: 5,
    quote: "The only place my work actually ends up. I connected a calendar, an inbox and one project — it found the client follow-ups I kept forgetting and surfaced them as tasks with prepared replies, waiting for my approval.",
    points: [
      { k: "What I loved", v: "It connected the right things for me — it turned emails + calendar into a real to-do, not another list to maintain." },
      { k: "What surprised me", v: "Nothing was sent, moved or booked without me pressing approve. That is exactly the control I needed." },
      { k: "One thing to watch", v: "Be honest with it. The clearer your task names, the sharper its next actions are." },
    ],
  },
  {
    name: "Sam R.", role: "Product manager · team + family organiser", rating: 5,
    quote: "Feels like the system knows what week I\u2019m having. The weekly review saw the project slipping two weeks out, flagged the blocked task, and prepared the follow-up note to the person waiting. I just approved it.",
    points: [
      { k: "What I loved", v: "Blocks are its superpower. It lists what is waiting on whom, so nobody silently gets stuck." },
      { k: "What surprised me", v: "The same system runs my household week — school admin, groceries, the holiday plan. It is not a corporate tool." },
      { k: "One thing to watch", v: "I want more connectors for my niche apps. The daily ones I use are all there." },
    ],
  },
  {
    name: "Aisha K.", role: "Freelancer + side business owner", rating: 5,
    quote: "Not another chatbot. I expected an answer box — instead it prepared a pricing comparison, a client follow-up and a calendar plan, and asked me to approve the important ones. The whole thing feels under my control.",
    points: [
      { k: "What I loved", v: "It completes work, not just answers: prepared the draft, set the task, scheduled the block." },
      { k: "What surprised me", v: "Client-facing and financial actions always wait for my approval. That made me trust it fast." },
      { k: "One thing to watch", v: "Coming from separate apps, this is the first place I see what is next without hunting." },
    ],
  },
];

// ------------------------------------------------------------------ integrations
const INTEGRATIONS = [
  { icon: Users, title: "People and contacts", ex: "Show who is involved, what they are waiting for, and what needs to be communicated." },
  { icon: Mail, title: "Email and messages", ex: "Find the important conversations, show what needs a reply, and prepare a reply for your approval." },
  { icon: CalendarDays, title: "Calendar and meetings", ex: "Help the AI find free time, plan meetings, prepare your day and remind you what is coming next." },
  { icon: ListTodo, title: "Tasks and reminders", ex: "Bring every to-do into one place and surface what actually matters today." },
  { icon: Briefcase, title: "Projects and work areas", ex: "Keep the people, files, tasks and deadlines of each project connected and moving." },
  { icon: FileText, title: "Files and documents", ex: "Find files, organise information, explain what is inside and show what is missing." },
  { icon: MessageSquare, title: "Teams and communication", ex: "Follow what the team is deciding and who needs an answer before something is blocked." },
  { icon: GraduationCap, title: "Learning and education", ex: "Plan courses, deadlines, study time and progress for yourself or your family." },
  { icon: Home, title: "Family and personal planning", ex: "Coordinate schedules, plans and responsibilities across the people in your life." },
  { icon: Briefcase, title: "Business and customer work", ex: "Track clients, orders, follow-ups and the work that keeps customers happy." },
  { icon: Plane, title: "Travel and appointments", ex: "Organise trips, bookings, appointments and everything that needs to happen before." },
  { icon: ShoppingCart, title: "Shopping and household planning", ex: "Turn shared lists, routines and errands into something nobody has to remember." },
  { icon: Wallet, title: "Finance organisation", ex: "Keep bills, budgets and payments visible and prepare the renegotiations worth doing." },
  { icon: HeartPulse, title: "Health and appointment planning", ex: "Keep appointments, medications and reminders organised so nothing important is missed." },
  { icon: Building2, title: "Local or official services", ex: "Manage official forms, permits and local services where they are allowed in your region." },
];

const NORMAL_APPS = [
  "Tasks live in one place.",
  "Messages live in another place.",
  "Meetings are somewhere else entirely.",
  "Files are hard to find when you need them.",
  "The AI gives an answer but does not finish the connected work.",
  "You have to remember everything yourself.",
];

const THIS_SYSTEM = [
  "Brings your human services together in one connected place.",
  "Ships AI agents that do the work — not chatbots that reply with noise.",
  "Understands the full task — not just one app.",
  "Connects messages, people, meetings, files and projects.",
  "Shows what should happen next.",
  "Prepares the work with AI.",
  "Asks for approval before important actions.",
  "Keeps history and shows what happened.",
  "Helps the human finish the work.",
];

const AI_HELPS = [
  "Understanding", "Organising", "Searching", "Preparing", "Summarising",
  "Planning", "Reminding", "Comparing", "Connecting tools", "Finding the next action",
];

const HUMAN_DECIDES = [
  "Approve important actions", "Send important messages", "Confirm appointments",
  "Submit official information", "Share sensitive information", "Change permissions", "Accept recommendations",
];

const TRUST = [
  { icon: Plug, k: "You choose what to connect", v: "Start with one service. Add more only when you need them — nothing is forced." },
  { icon: Eye, k: "You choose what the AI can access", v: "Access is per service and per permission. You decide the boundaries." },
  { icon: ShieldCheck, k: "Important actions need your approval", v: "Sending, booking, signing and paying are prepared by AI and approved by you." },
  { icon: History, k: "All activity can be checked", v: "The system shows what it did, when, and why — nothing happens invisibly." },
  { icon: SlidersHorizontal, k: "Permissions can be changed", v: "Change who or what can do what, at any time, in plain language." },
  { icon: Unplug, k: "Services can be disconnected", v: "The moment you stop trusting a connection, unplug it. You stay in charge." },
  { icon: FolderOpen, k: "Project data can be managed", v: "Export, organise, archive or remove your data — it belongs to you." },
  { icon: Lock, k: "The system explains itself", v: "Every recommendation and action shows a reason you can read and challenge." },
];

const STEPS = [
  { icon: MessageSquare, title: "Tell the system what you need", sub: "Write or speak in normal language — \u201Cwhat should I do first today?\u201D" },
  { icon: Brain, title: "The AI understands the goal", sub: "It explains what it understood and what it plans to do before touching anything." },
  { icon: Plug, title: "The right human tools connect", sub: "Only the allowed calendar, messages, files, projects, people or services get used." },
  { icon: ListTodo, title: "The work gets prepared", sub: "The AI organises, drafts, compares, schedules or creates the next task for you." },
  { icon: ShieldCheck, title: "Humans stay in control", sub: "You review the important prepared actions and approve them before they happen." },
];

export default function Landing() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const activeCase = USECASES.find((c) => c.id === caseId) ?? null;
  const [openFaq, setOpenFaq] = useState<string | null>(HARD[0].q);

  return (
    <ThemeScope>
      <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white antialiased">
        {/* Atmosphere */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full opacity-25" style={{ background: "var(--c-accent)", filter: "blur(150px)" }} />
          <div className="absolute top-1/3 -left-40 h-[460px] w-[460px] rounded-full opacity-20" style={{ background: "#e883ff", filter: "blur(140px)" }} />
          <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full opacity-[0.18]" style={{ background: "var(--c-accent-strong)", filter: "blur(150px)" }} />
          <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "radial-gradient(rgba(160,130,255,0.35) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        </div>

        <div className="relative z-10">
          <Navbar />

          {/* ============================== HERO ============================== */}
          <section className="relative px-5 pt-32 pb-10 sm:px-8 sm:pt-36">
            <div className="mx-auto max-w-6xl text-center">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-accent-text)]">
                  <Sparkles className="h-3.5 w-3.5" /> Human essentials × powerful AI agents — no nonsense
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08 }}
                className="mx-auto mt-7 max-w-5xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl"
              >
                Your human essentials, integrated with powerful AI tools —{" "}
                <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">
                  agents that do as you ask, not reply back with nonsense.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16 }}
                className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-[var(--muted)] sm:text-lg"
              >
                This is not a chatbot that answers back. <strong className="text-white">Human essentials</strong> — your tools, people, messages, meetings, files, projects, reminders and tasks — live in one connected system with{" "}
                <strong className="text-white">AI agents that actually do the work</strong>: they connect the right things, prepare the next action and move the job forward, and{" "}
                <strong className="text-white">you stay in control</strong> before anything important happens.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18 }}
                className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-[var(--muted)] sm:text-base"
              >
                <span className="font-bold text-[var(--c-accent-text)]">CAN&apos;T DECIDE GPT</span> is the one AI place for everything humans manage — one person, a family, a freelancer, a team or a business. AI agents carry the load and do the work, you keep control. It is the first system to bring human integration back onto an online system with powerful AI help — work finders, work takers and new businesses meet on one board, and every worker can be paired straight into any project.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]/70 sm:text-sm"
              >
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-[var(--c-accent-text)]" />Human integrations</span>
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-[var(--c-accent-text)]" />Human tasks</span>
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-[var(--c-accent-text)]" />AI help</span>
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-[var(--c-accent-text)]" />One connected place</span>
                <span><Check className="mr-1 inline h-3.5 w-3.5 text-[var(--c-accent-text)]" />You stay in control</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.26 }}
                className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <CTA href="/login?mode=signup">
                  Start your human AI workspace <ArrowRight className="h-4 w-4" />
                </CTA>
                <CTA href="/demo" kind="outline">
                  <Play className="h-4 w-4" /> Preview the live dashboard
                </CTA>
                <CTA href="#how" kind="outline">
                  <Play className="h-4 w-4" /> See how it works
                </CTA>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.34 }}
                className="mt-4 text-xs text-[var(--muted)]/80"
              >
                Connect only what you need — and start with one useful task.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }} className="mx-auto mt-12 max-w-5xl">
                <Preview />
              </motion.div>
            </div>
          </section>

          {/* ============================ TICKER ============================ */}
          <section className="relative border-y border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]/80">
              <span>For any work</span><span className="h-1 w-1 rounded-full bg-[var(--c-accent-text)]" />
              <span>For one person</span><span className="h-1 w-1 rounded-full bg-[var(--c-accent-text)]" />
              <span>For a family</span><span className="h-1 w-1 rounded-full bg-[var(--c-accent-text)]" />
              <span>For a team</span><span className="h-1 w-1 rounded-full bg-[var(--c-accent-text)]" />
              <span>For a business</span><span className="h-1 w-1 rounded-full bg-[var(--c-accent-text)]" />
              <span>For a larger organisation</span>
            </div>
          </section>

          {/* ============================ LIVE DEMO PREVIEW ============================ */}
          <section id="live-demo" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="Live dashboard demo"
                title={<>Preview how the dashboard performs — <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">before you sign up.</span></>}
                sub="Real screens, really running: zoom the infinite system map over every workflow, every tool and all three radial toolkits, open the project constellation, and hover the orbital tools. No account needed — it behaves exactly like the live system."
              />
              <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { href: "/demo#system-map", icon: Map, t: "The infinite system map", d: "Zoom out to see every workflow lane, the zones, every tool in the system, and the three radial toolkits side by side — then zoom back in." },
                  { href: "/demo#projects-space", icon: FolderKanban, t: "The projects space", d: "The floating project constellation, the create hub, live attention ticks and the free space that holds the radial toolkits and briefings." },
                  { href: "/demo#radial-toolkits", icon: Orbit, t: "All three radial tool kits", d: "Tier 1 CORE included, the $1,000 PREMIUMS and the $1,600 PRO PREMIUMS. Hover a tool, open it, read what it is and how it helps." },
                ].map((d, i) => (
                  <Reveal key={d.href} delay={i * 0.08}>
                    <Link
                      href={d.href}
                      className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-[var(--c-accent-border)] hover:bg-white/[0.05] hover:shadow-[0_0_30px_var(--c-accent)]"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] shadow-[var(--c-glow)]">
                        <d.icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 text-base font-bold text-white">{d.t}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{d.d}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--c-accent-text)]">
                        Preview it <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.18} className="mt-10 text-center">
                <CTA href="/demo">
                  Open the live dashboard demo <ArrowRight className="h-4 w-4" />
                </CTA>
                <p className="mt-3 text-xs text-[var(--muted)]/80">No signup · no setup · the real system, clickable right now.</p>
              </Reveal>
            </div>
          </section>

          {/* ====================== SEE IT IN ACTION — REAL SCREENS ====================== */}
          <section id="screens" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="Real screens. Real system."
                title={<>See the dashboard <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">actually doing the work.</span></>}
                sub="No mockups, no still images of a fantasy — these are screenshots of the live system in use: the infinite system map, the project constellation, and all three radial toolkits running real tools."
              />
              <div className="mt-12 space-y-6">
                {[
                  { src: "/shots/system-map.png", t: "The infinite system map", d: "Zoom out over every workflow lane, every zone, every tool and all three radial toolkits — then zoom back in to work." },
                  { src: "/shots/projects-space.png", t: "The projects space", d: "The floating project constellation and the free space that holds the radial toolkits, briefings and everything moving." },
                  { src: "/shots/radial-toolkits.png", t: "All three radial tool kits", d: "Tier 1 CORE included, the $1,000 PREMIUMS and the $1,600 PRO PREMIUMS — hover a tool, open it, use it." },
                ].map((s, i) => (
                  <Reveal key={s.src} delay={i * 0.06}>
                    <div className="overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[#0d0a1c]/80 backdrop-blur-xl">
                      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                        <span className="ml-3 hidden font-mono text-[11px] text-gray-500 sm:block">cantdecidegpt.vercel.app — live</span>
                        <span className="ml-auto rounded-full border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--c-accent-text)]">
                          Real screenshot
                        </span>
                      </div>
                      <div className="relative">
                        <Image
                          src={s.src}
                          alt={`${s.t} — live dashboard screenshot`}
                          width={1440}
                          height={820}
                          className="w-full border-0"
                          loading="lazy"
                        />
                      </div>
                      <div className="grid gap-2 border-t border-white/5 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <h3 className="text-sm font-bold text-white">{s.t}</h3>
                          <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{s.d}</p>
                        </div>
                        <a
                          href={s.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-4 py-2 text-xs font-bold text-[var(--c-accent-text)] hover:brightness-110"
                        >
                          <Eye className="h-3.5 w-3.5" /> Full size
                        </a>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.2} className="mt-10 text-center">
                <CTA href="/demo">
                  Walk around it yourself <ArrowRight className="h-4 w-4" />
                </CTA>
              </Reveal>
            </div>
          </section>

          {/* ======================== WHAT THIS REALLY IS ======================== */}
          <section id="what" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="What this really is"
                title={<>A connected human AI system — <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">not one more app.</span></>}
                sub="It helps a person understand what needs to be done, brings the correct services and information together, prepares the work, and shows the next best action. It can help one person, a family, a team, a business or a larger organisation."
              />

              <Reveal delay={0.1}>
                <div className="relative mt-12 overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[#0d0a1c]/80 p-6 backdrop-blur-xl sm:p-8">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20" style={{ background: "var(--c-accent)", filter: "blur(90px)" }} />
                  <div className="relative grid grid-cols-1 gap-3 md:grid-cols-6">
                    {[
                      { icon: MessageSquare, t: "Your need", d: "You say what matters, in your own words." },
                      { icon: Brain, t: "AI understands", d: "It explains what it understood and plans to do." },
                      { icon: Plug, t: "Human tools connect", d: "The right calendar, inbox, files, people & projects." },
                      { icon: ListTodo, t: "Work gets prepared", d: "Organised, drafted, scheduled and shown to you." },
                      { icon: ShieldCheck, t: "You approve", d: "Important actions wait for your yes." },
                      { icon: CheckCircle2, t: "Task completed", d: "Done, recorded, and history kept." },
                    ].map((s, i) => (
                      <div key={s.t} className="relative">
                        <div
                          className="flex h-full flex-col items-center gap-2.5 rounded-2xl border border-[var(--glass-border)] bg-white/[0.03] px-3 py-5 text-center"
                          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
                        >
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] shadow-[var(--c-glow)]">
                            <s.icon className="h-5 w-5" />
                          </span>
                          <p className="text-sm font-bold text-white">{s.t}</p>
                          <p className="text-[11px] leading-snug text-[var(--muted)]">{s.d}</p>
                        </div>
                        {i < 5 && (
                          <span className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-sm font-black text-[#b66bff] md:block">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ========================== FIRST QUESTIONS ========================== */}
          <section id="questions" className="relative px-5 pb-20 sm:px-8 sm:pb-28">
            <div className="mx-auto max-w-6xl">
              <Reveal className="mx-auto max-w-3xl text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--c-accent-text)]">The first questions, answered fast</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">What is this website?</h2>
              </Reveal>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { q: "What is this website?", a: "It is a human-focused AI workspace that connects the services, people, tasks and information you already use — then helps you organise and complete real work." },
                  { q: "Is this only another AI chatbot?", a: "No. It does not only give answers. It connects the right tools, files, people, calendars, messages and tasks so the work can actually move forward." },
                  { q: "Is this only for companies?", a: "No. It helps with personal life, family planning, learning, work, business, projects, communication, documents and daily tasks." },
                  { q: "Does the AI control everything?", a: "No. The AI prepares, organises and recommends, but you stay in control of important actions and approve them before they happen." },
                  { q: "Do I need to connect everything?", a: "No. Start with one or two services and connect more only when you need them." },
                  { q: "What makes this different?", a: "It brings human needs and real work together — instead of showing separate apps, separate tasks and separate AI answers." },
                ].map((f, i) => (
                  <Reveal key={f.q} delay={i * 0.05}>
                    <div className="glass h-full rounded-2xl p-5 transition-all hover:border-[var(--c-accent-border)]">
                      <p className="text-sm font-bold text-white">{f.q}</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">{f.a}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* =========================== INTEGRATIONS =========================== */}
          <section id="integrations" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-7xl">
              <SectionHead
                kicker="100% focused on human integrations"
                title={<>Designed around <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">what humans actually do every day.</span></>}
                sub="Not technical connectors for engineers — a connected place for the real things in your life and work."
              />
              <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {INTEGRATIONS.map((it, i) => (
                  <Reveal key={it.title} delay={(i % 5) * 0.04}>
                    <div className="glass group h-full rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[0_0_28px_rgba(56,189,248,0.18)]">
                      <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-sky-400/[0.1] text-sky-300 transition-colors group-hover:bg-sky-400 group-hover:text-white">
                        <it.icon className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-bold text-white">{it.title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{it.ex}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.15} className="mt-10 text-center">
                <CTA href="/dashboard/integrations">
                  Explore human integrations <ArrowRight className="h-4 w-4" />
                </CTA>
              </Reveal>
            </div>
          </section>

          {/* ======================= BETTER THAN APPS ======================= */}
          <section id="better" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="Not just connected apps"
                title={<>Separate apps <span className="text-[var(--muted)]">vs</span> <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">one connected system</span></>}
              />
              <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Reveal delay={0.05}>
                  <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-7">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Normal separate apps</p>
                    <ul className="mt-5 space-y-3">
                      {NORMAL_APPS.map((x) => (
                        <li key={x} className="flex items-start gap-3 text-sm text-gray-400">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/5 text-gray-500"><X className="h-3 w-3" /></span>
                          <span className="leading-relaxed">{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
                <Reveal delay={0.12}>
                  <div
                    className="h-full rounded-3xl border p-7"
                    style={{ borderColor: "var(--c-accent-border)", background: "linear-gradient(150deg, var(--c-accent-soft), rgba(0,0,0,0.15))" }}
                  >
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--c-accent-text)]">This system</p>
                    <ul className="mt-5 space-y-3">
                      {THIS_SYSTEM.map((x) => (
                        <li key={x} className="flex items-start gap-3 text-sm text-gray-100">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-3 w-3" /></span>
                          <span className="leading-relaxed">{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ========================= WHAT CAN I DO ========================= */}
          <section id="use" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-7xl">
              <SectionHead
                kicker="What can I do with this?"
                title={<>Just ask it, the way <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">you would ask a person.</span></>}
                sub="Tap a request to see how the AI and your human integrations work together to answer it."
              />

              <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {USECASES.map((c, i) => (
                  <Reveal key={c.id} delay={(i % 4) * 0.04}>
                    <button
                      type="button"
                      onClick={() => setCaseId(caseId === c.id ? null : c.id)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--c-accent-border)] hover:bg-white/[0.06]"
                      style={caseId === c.id ? { borderColor: "var(--c-accent-border)", background: "var(--c-accent-soft)" } : undefined}
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]">
                          <c.icon className="h-4 w-4" />
                        </span>
                        <span className="text-[13px] font-semibold leading-snug text-gray-100">{c.title}</span>
                      </span>
                    </button>
                  </Reveal>
                ))}
              </div>

              {/* Example of how it works */}
              <Reveal delay={0.1}>
                <div className="mt-8 flex items-start gap-4 rounded-2xl border border-[var(--c-accent-border)] p-5" style={{ background: "linear-gradient(135deg, rgba(20,12,42,0.9), rgba(0,0,0,0.3))" }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] shadow-[var(--c-glow)]">
                    {activeCase ? <activeCase.icon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-white">
                      {activeCase ? activeCase.title : "How the AI and your human integrations work together"}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-gray-300">
                      {activeCase
                        ? activeCase.ex
                        : "Your calendar, inbox, files and projects are connected. The AI understands the request, prepares the work using only what you allowed, and brings the result to one place for you — approving the important steps yourself."}
                    </p>
                  </div>
                  {activeCase ? (
                    <button type="button" onClick={() => setCaseId(null)} className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-white" aria-label="Close example">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </Reveal>
            </div>
          </section>

          {/* =========================== HOW IT WORKS =========================== */}
          <section id="how" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="How it works"
                title={<>Five simple steps. <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">No manual required.</span></>}
              />
              <div className="relative mt-14">
                <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-[#b66bff]/50 to-transparent lg:block" />
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
                  {STEPS.map((s, i) => (
                    <Reveal key={s.title} delay={i * 0.09}>
                      <div className="relative flex flex-col items-center text-center">
                        <span className="grid h-20 w-20 place-items-center rounded-full border border-[var(--c-accent-border)] bg-[#0d0a1c] shadow-[var(--c-glow)]">
                          <s.icon className="h-8 w-8 text-[var(--c-accent-text)]" />
                        </span>
                        <span className="absolute -top-2 right-1/2 translate-x-1/2 rounded-full bg-[var(--c-accent)] px-2 py-0.5 text-[10px] font-black text-white">{i + 1}</span>
                        <p className="mt-4 text-sm font-black text-white">{s.title}</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{s.sub}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ===================== AI DOES HEAVY, HUMANS CONTROLL ===================== */}
          <section id="ai-human" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="AI plus human, not AI instead of human"
                title={<>The AI does the heavy work. <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">Humans keep the important control.</span></>}
                sub="The AI organises information, finds patterns, prepares drafts, breaks work into steps, reminds you, connects services and recommends the next action. You still decide what is important, what is sent, what is approved and what happens."
              />
              <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Reveal delay={0.05}>
                  <div className="glass h-full rounded-3xl p-7">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">The AI helps with</p>
                    <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {AI_HELPS.map((x) => (
                        <li key={x} className="flex items-center gap-2 text-sm text-gray-200">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-300" /> {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
                <Reveal delay={0.12}>
                  <div className="h-full rounded-3xl border border-amber-400/30 p-7" style={{ background: "rgba(30,22,8,0.35)" }}>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Humans decide</p>
                    <ul className="mt-5 grid grid-cols-1 gap-2.5">
                      {HUMAN_DECIDES.map((x) => (
                        <li key={x} className="flex items-center gap-2 text-sm text-gray-100">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" /> {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ========================== WORK FINDERS & TAKERS ========================== */}
          <section id="people" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="Human integrations on one system"
                title={<>Bring human brains back <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">to the high points.</span></>}
                sub="Work finders and work takers live on the same board. New businesses arrive, post the work they need, and hire real humans from every field — designers, coders, writers, marketers, sales, finance, support, operations. Registration is open to anyone."
              />
              <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Handshake, t: "Work finders", d: "Register the field you are good at with your resume, details, email and socials. New teams find you and connect." },
                  { icon: Briefcase, t: "Work takers & new businesses", d: "Start or run a business with $1,000s of AI setup. Post the work you need, hire people and get together." },
                  { icon: MessageSquare, t: "Direct connect & chat", d: "No middleman. You connect with anyone on the board and talk in a clean, professional thread." },
                  { icon: Mic, t: "Voice controlled", d: "Say \u201Cfind work as a designer\u201D or \u201Copen my messages\u201D — the board and your chats answer by voice." },
                ].map((f, i) => (
                  <Reveal key={f.t} delay={0.04 * i}>
                    <div className="glass h-full rounded-3xl p-6">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] border border-[var(--c-accent-border)]">
                        <f.icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 text-base font-bold text-white">{f.t}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-400">{f.d}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={0.15} className="mt-8">
                <div className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[#0d0a1c]/80 p-7 backdrop-blur-xl sm:p-9">
                  <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full opacity-25" style={{ background: "var(--c-accent)", filter: "blur(90px)" }} />
                  <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--c-accent-text)]">The $1,600 plan</p>
                      <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">
                        We invest $1,000s getting a business running. You get your $1,600 plan and we get your customers set up.
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                        Projects, customers, marketing, sales, finance, content — set up and ready. And the system only gets
                        better with more humans: your work and your workers are the others who join. So share it. Bring a
                        human brain to the high points and become a valuable user now.
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <CTA href="/login?mode=signup">
                          Join the workboard <ArrowRight className="h-4 w-4" />
                        </CTA>
                        <CTA href="/dashboard/plans" kind="outline">Compare plans</CTA>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        "Register as a work finder or a work taker — any field, anyone",
                        "New business starters, operators and companies hire people right here",
                        "Connect directly and chat until the work is agreed",
                        "Find work or workers faster as the community grows",
                      ].map((x) => (
                        <div key={x} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--c-accent-text)]" />
                          <p className="text-sm text-gray-200">{x}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ========================== SEE THE REAL RESULT ========================== */}
          <section id="results" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="See the real result"
                title={<>A day running in <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">the human AI workspace.</span></>}
                sub="These are real human outcomes — not technical numbers. Tasks, messages, meetings, approvals, and the services they came from."
              />
              <Reveal delay={0.1} className="mt-12">
                <Preview showStats />
              </Reveal>
              <Reveal delay={0.18} className="mt-10 text-center">
                <CTA href="/dashboard">
                  See the full human AI workspace <ArrowRight className="h-4 w-4" />
                </CTA>
              </Reveal>
            </div>
          </section>

          {/* ======================= SIMPLE & POWERFUL ======================= */}
          <section id="familiar" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="Familiar for everyone, powerful for more"
                title={<>Simple when you want it. <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">Powerful when you need it.</span></>}
                sub="You never have to learn workflows, nodes, APIs, automations or AI model settings to use the system."
              />
              <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Reveal delay={0.05}>
                  <div className="glass h-full rounded-3xl p-7">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300"><Eye className="mr-1 inline h-4 w-4" />Simple view</p>
                    <p className="mt-2 text-[13px] text-[var(--muted)]">See your day, tasks, messages, meetings, files and the next action — one clear screen. This is what most people will ever need.</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {["My day", "Tasks", "Messages", "Meetings", "Files", "Next action"].map((x) => (
                        <span key={x} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-gray-300">{x}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
                <Reveal delay={0.12}>
                  <div
                    className="h-full rounded-3xl border p-7"
                    style={{ borderColor: "var(--c-accent-border)", background: "linear-gradient(150deg, rgba(30,14,60,0.7), rgba(0,0,0,0.2))" }}
                  >
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--c-accent-text)]"><SlidersHorizontal className="mr-1 inline h-4 w-4" />Power view</p>
                    <p className="mt-2 text-[13px] text-[var(--muted)]">Open full projects, the workflow canvas, the radial toolkits, automations, integrations, permissions and system controls — all in one place.</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {["Projects", "Workflow canvas", "Radial toolkits", "Automations", "Integrations", "Permissions"].map((x) => (
                        <span key={x} className="rounded-full border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--c-accent-text)]">{x}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ========================== PROJECTS & WORK ========================== */}
          <section id="projects" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-7xl">
              <SectionHead
                kicker="Projects and work"
                title={<>Every project gets <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">its own human AI flow.</span></>}
                sub="Create a project, connect the people and services needed, see what is running, what is waiting and what should happen next — and let the AI help move it forward."
              />
              <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
                {PROJECTS.map((p, i) => (
                  <Reveal key={p.name} delay={i * 0.07}>
                    <div className="glass flex h-full flex-col rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-[var(--c-accent-border)]">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-white">{p.name}</p>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold" style={{ color: p.tone }}>{p.progress}%</span>
                      </div>
                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: `linear-gradient(90deg, ${p.tone}, #e883ff)` }} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-gray-300">
                        <span className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-emerald-300">{p.running} running</span>
                        <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-amber-300">{p.blocked} blocked</span>
                        <span className="rounded-md bg-white/5 px-2 py-0.5">{p.files} files</span>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-sky-300" />
                        <span className="text-[11px] text-gray-400">{p.people.join(" · ")}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">Connected: {p.services}</p>
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] px-3 py-2">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--c-accent-text)]" />
                        <p className="text-[11px] leading-snug text-gray-100"><span className="font-bold text-white">AI next action:</span> {p.next}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.15} className="mt-10 text-center">
                <CTA href="/dashboard/projects">
                  Create your first project <Rocket className="h-4 w-4" />
                </CTA>
              </Reveal>
            </div>
          </section>

          {/* =========================== TRUST & CONTROL =========================== */}
          <section id="trust" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHead
                kicker="Trust and control"
                title={<>You connect, you decide, <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">you stay in control.</span></>}
                sub="Connecting your services should feel safe. Here is exactly how the system is built to keep you in the driver's seat."
              />
              <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {TRUST.map((t, i) => (
                  <Reveal key={t.k} delay={(i % 4) * 0.05}>
                    <div className="glass h-full rounded-2xl p-5 transition-all hover:border-[var(--c-accent-border)]">
                      <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent-text)]">
                        <t.icon className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-bold text-white">{t.k}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{t.v}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.15} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CTA href="/dashboard/trust">
                  <ShieldCheck className="h-4 w-4" /> View privacy and control
                </CTA>
                <CTA href="/dashboard/security" kind="outline">
                  Permissions and settings <Settings className="h-4 w-4" />
                </CTA>
              </Reveal>
            </div>
          </section>

          {/* ============================== REVIEWS ============================== */}
          <section id="reviews" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-7xl">
              <SectionHead
                kicker="From the people who tested it"
                title={<>Real people ran it. <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">Here is what they reported.</span></>}
                sub="Detailed reviews from the site's testers — what worked, what surprised them, and what to keep an eye on."
              />
              <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
                {REVIEWS.map((r, i) => (
                  <Reveal key={r.name} delay={i * 0.08}>
                    <div className="glass flex h-full flex-col rounded-3xl p-6">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className="h-3.5 w-3.5" fill={s < r.rating ? "#fbbf24" : "none"} color={s < r.rating ? "#fbbf24" : "#6b7280"} />
                        ))}
                      </div>
                      <Quote className="mt-4 h-5 w-5 text-[var(--c-accent-text)]" />
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-100">{r.quote}</p>
                      <div className="mt-4 space-y-2.5">
                        {r.points.map((p) => (
                          <div key={p.k} className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--c-accent-text)]">{p.k}</p>
                            <p className="mt-0.5 text-[11.5px] leading-snug text-gray-300">{p.v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-auto pt-4">
                        <p className="text-sm font-bold text-white">{r.name}</p>
                        <p className="text-[11px] text-gray-500">{r.role}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ========================== HARD QUESTIONS ========================== */}
          <section id="hard" className="relative px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-3xl">
              <SectionHead
                kicker="The hard questions"
                title={<>Asked directly, <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">answered honestly.</span></>}
              />
              <div className="mt-10 space-y-3">
                {HARD.map((f) => (
                  <Reveal key={f.q} delay={0.03}>
                    <div className="glass overflow-hidden rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === f.q ? null : f.q)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
                      >
                        <span className="text-sm font-bold text-white">{f.q}</span>
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 text-gray-400" style={openFaq === f.q ? { transform: "rotate(180deg)" } : undefined}>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </span>
                      </button>
                      {openFaq === f.q && (
                        <p className="border-t border-white/[0.06] px-5 py-4 text-[13px] leading-relaxed text-[var(--muted)]">{f.a}</p>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ============================ FINAL MESSAGE ============================ */}
          <section id="start" className="relative px-5 py-24 sm:px-8 sm:py-32">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20" style={{ background: "linear-gradient(135deg, var(--c-accent), #e883ff)", filter: "blur(140px)" }} />
            </div>
            <Reveal className="relative mx-auto max-w-4xl text-center">
              <p className="text-2xl font-black leading-snug text-white sm:text-4xl">
                Your tools are separate. Your tasks are spread out. Your time is limited.
              </p>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg">
                This system brings the human work together and gives you powerful AI help to understand, organise and complete it.
              </p>
              <p className="mx-auto mt-8 max-w-3xl text-lg font-bold leading-relaxed text-white sm:text-xl">
                <span className="text-[var(--c-accent-text)]">Connect what matters.</span> Understand what is next.
                <br />
                Let AI help. <span className="bg-gradient-to-r from-[var(--c-accent-text)] to-[#e883ff] bg-clip-text text-transparent">Keep human control.</span>
              </p>
              <div className="mt-10">
                <CTA href="/login?mode=signup" className="px-12 py-4 text-base">
                  Start now <ArrowRight className="h-5 w-5" />
                </CTA>
              </div>
              <p className="mt-6 text-xs text-[var(--muted)]/80">One useful connection is enough to begin. The rest grows with you.</p>
            </Reveal>
          </section>

          {/* ============================== FOOTER ============================== */}
          <footer className="relative border-t border-white/[0.06] px-5 pb-10 pt-12 sm:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Image src="/cantdecide-gpt-logo.png" alt="CAN'T DECIDE GPT logo" width={36} height={36} className="h-9 w-9 rounded-xl object-cover" />
                    <span className="text-lg font-black text-white">CAN&apos;T DECIDE GPT</span>
                  </div>
                  <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--muted)]">
                    The human-focused AI workspace. Your real life, real work and real services — connected, organised and completed together.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-500">Start here</p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {[
                      { label: "Start your human AI workspace", href: "/login?mode=signup" },
                      { label: "Connect your first service", href: "/dashboard/integrations" },
                      { label: "Create your first project", href: "/dashboard/projects" },
                      { label: "Ask the AI", href: "/dashboard/voice" },
                      { label: "See the dashboard", href: "/dashboard" },
                    ].map((b) => (
                      <Link key={b.label} href={b.href} className="text-xs text-gray-300 transition-colors hover:text-[var(--c-accent-text)]">
                        {b.label} →
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-500">Explore</p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {[
                      { label: "Explore human integrations", href: "#integrations" },
                      { label: "See how it works", href: "#how" },
                      { label: "Projects and work", href: "#projects" },
                      { label: "View privacy and control", href: "/dashboard/trust" },
                      { label: "Radial toolkits", href: "/dashboard/toolkits" },
                      { label: "Tasks and reminders", href: "/dashboard/tasks" },
                      { label: "AI voice assistant", href: "/dashboard/voice" },
                      { label: "Colours and appearance", href: "/dashboard/settings" },
                      { label: "The two specials", href: "/dashboard/plans" },
                    ].map((b) => (
                      <Link key={b.label} href={b.href} className="text-xs text-gray-300 transition-colors hover:text-[var(--c-accent-text)]">
                        {b.label} →
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-5 sm:flex-row">
                <p className="text-[11px] text-gray-600">© 2026 CAN&apos;T DECIDE GPT. All rights reserved.</p>
                <p className="text-[11px] text-gray-600">One connected place for everything humans need to do.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ThemeScope>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-[var(--glass-border)] bg-[#07060f]/85 backdrop-blur-xl" : "bg-transparent"}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/cantdecide-gpt-logo.png" alt="CAN'T DECIDE GPT logo" width={36} height={36} priority className="h-9 w-9 rounded-xl object-cover" />
          <span className="text-base font-black tracking-tight text-white sm:text-lg">CAN&apos;T DECIDE GPT</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] font-medium text-[var(--muted)] transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-[13px] font-medium text-[var(--muted)] transition-colors hover:text-white sm:block">
            Sign in
          </Link>
          <Link
            href="/login?mode=signup"
            className="rounded-full px-5 py-2 text-[13px] font-bold text-white shadow-[var(--c-glow)] transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-strong))" }}
          >
            Start now
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}