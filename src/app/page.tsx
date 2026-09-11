"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  Code,
  ImageIcon,
  FileText,
  Languages,
  PenTool,
  BarChart3,
  Mic,
  ArrowRight,
  Play,
  Check,
  X,
  Zap,
  Gem,
  HeartHandshake,
  Brain,
  Activity,
} from "lucide-react";
import { SITE_PLANS, type SitePlan } from "@/lib/plans";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: "AI Chat",
    description: "Intelligent conversations powered by advanced language models",
  },
  {
    icon: Code,
    title: "Code Generator",
    description: "Write, debug, and refactor code in 50+ languages",
  },
  {
    icon: ImageIcon,
    title: "Image Generator",
    description: "Create stunning visuals from text descriptions",
  },
  {
    icon: FileText,
    title: "Text Summarizer",
    description: "Condense lengthy documents into key insights",
  },
  {
    icon: Languages,
    title: "Translator",
    description: "Translate between 100+ languages instantly",
  },
  {
    icon: PenTool,
    title: "Writing Assistant",
    description: "Craft emails, blogs, essays, and more with AI",
  },
  {
    icon: BarChart3,
    title: "Data Analysis",
    description: "Sentiment analysis, entity extraction, and more",
  },
  {
    icon: Mic,
    title: "Voice-to-Text",
    description: "Transcribe and process audio content",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Choose Your Tool",
    description:
      "Pick from chat, code, images, translation, and more — every AI capability in one place.",
  },
  {
    step: "02",
    title: "Input Your Request",
    description:
      "Type, paste, or speak your request. Our interface adapts to whatever you're trying to build.",
  },
  {
    step: "03",
    title: "Get AI-Powered Results",
    description:
      "Receive instant, polished results you can refine, iterate on, and export in seconds.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

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

function useScrollY() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrollY;
}

export default function Home() {
  const scrollY = useScrollY();

  const heroScale = Math.max(1 - scrollY / 800, 0.92);
  const heroOpacity = Math.max(1 - scrollY / 500, 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative flex min-h-screen items-center justify-center px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/30 blur-[140px]" />
          <div className="absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full bg-secondary/20 blur-[120px]" />
          <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[130px]" />
          <div className="hero-grid absolute inset-0" />
        </div>

        <motion.div
          animate={{ opacity: heroOpacity, scale: heroScale }}
          transition={{ ease: "easeOut", duration: 0.3 }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-light">
              <Zap className="h-4 w-4" />
              The Generative Human Workspace
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-gradient text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl"
          >
            High-Tech AI. Fully Human.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
          >
            Not another box of AI tools — a living operating system where humans
            and AI co-work. Human integrations, generative insights and 55
            tools, all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/dashboard"
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-light hover:shadow-primary/50"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-border bg-surface/60 px-8 py-4 text-base font-semibold text-foreground backdrop-blur transition-colors hover:border-primary/50 hover:bg-surface-light"
            >
              <Play className="h-5 w-5 text-primary" />
              Watch Demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted"
          >
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> 14-day free trial
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> Cancel anytime
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-light">
              Features
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Every AI Tool. One Platform.
            </h2>
            <p className="mt-4 text-lg text-muted">
              Stop juggling a dozen apps. Can't Decide GPT brings the full power of AI
              into a single, seamless workspace.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.05}>
                <div className="group h-full rounded-2xl border border-border bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-surface-light hover:shadow-xl hover:shadow-primary/10">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary-light transition-colors group-hover:bg-primary group-hover:text-white">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="about" className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-light">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              From Idea to Result in Seconds
            </h2>
          </Reveal>

          <div id="how" className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.1}>
                <div className="relative h-full rounded-2xl border border-border bg-surface/50 p-8 backdrop-blur transition-colors hover:border-primary/50">
                  <span className="text-gradient text-7xl font-bold opacity-20">
                    {step.step}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="absolute -right-7 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-primary/60 md:block" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HUMAN WORKSPACE ============ */}
      <section id="humans" className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-light">
              Human + AI
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              The Human Workspace
            </h2>
            <p className="mt-4 text-lg text-muted">
              Full human integrations with high-tech AI. Humans stay in the
              loop by design — AI carries the busywork, people keep the
              judgement, and the insight board keeps generating.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: HeartHandshake,
                title: "Human Integrations",
                points: [
                  "Live presence for every person",
                  "Focus, skills and strengths",
                  "What AI carries for each human",
                ],
              },
              {
                icon: Brain,
                title: "Generative Insights",
                points: [
                  "AI-generated insight engine",
                  "Human-set and co-created signals",
                  "One live stream of thinking",
                ],
              },
              {
                icon: Activity,
                title: "Human + AI Co-working",
                points: [
                  "Direction from humans",
                  "Volume drafted by AI",
                  "Before AI ends us — we build it together",
                ],
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08}>
                <div className="group h-full rounded-2xl border border-border bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/60 hover:bg-surface-light hover:shadow-xl hover:shadow-indigo-500/10">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                    <card.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {card.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12 text-center">
            <Link
              href="/dashboard/humans"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-500 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-400"
            >
              Open the Human Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-light">
              Pricing
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Two Specials. Two Packs.
            </h2>
            <p className="mt-4 text-lg text-muted">
              The $1,000 plan covers the basic tools and services with the $1,000
              special included — the $1,600 plan adds the operator special with
              over $1,500 of new tools.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
            {SITE_PLANS.map((plan: SitePlan, i: number) => (
              <Reveal key={plan.id} delay={i * 0.1} className="h-full">
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-8 transition-all duration-300 ${
                    plan.featured
                      ? "border-primary bg-gradient-to-b from-primary/20 to-surface shadow-2xl shadow-primary/20"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/40">
                      Best Value
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-primary-light">
                    {plan.name}
                  </h3>
                  {plan.note && (
                    <p className="mt-1 text-xs text-muted">{plan.note}</p>
                  )}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-5xl font-bold">
                      ${plan.price.toLocaleString()}
                    </span>
                    <span className="text-muted">{plan.cadence}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary-light">
                    {plan.seats}
                  </p>
                  <p className="mt-3 text-sm text-muted">{plan.tagline}</p>

                  <div className="mt-6 flex-1 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                      What you get
                    </p>
                    {plan.features.map((feature) => (
                      <p key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-foreground/80">{feature}</span>
                      </p>
                    ))}
                  </div>

                  <div
                    className={`mt-6 rounded-xl border p-4 ${
                      plan.featured
                        ? "border-amber-400/40 bg-amber-400/10"
                        : "border-primary/30 bg-primary/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Gem className="h-4 w-4 text-amber-400" />
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        {plan.specials.label}
                      </p>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">{plan.specials.lead}</p>
                    <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {plan.specials.tools.map((tool) => (
                        <p key={tool} className="flex items-center gap-2 text-xs text-foreground/80">
                          <Check className="h-3 w-3 shrink-0 text-amber-400" />
                          {tool}
                        </p>
                      ))}
                    </div>
                    {plan.bonus && (
                      <p className="mt-3 text-xs font-bold text-amber-300">
                        {plan.bonus}
                      </p>
                    )}
                  </div>

                  {plan.notIncluded.length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">
                        Not included
                      </p>
                      <div className="mt-2.5 space-y-1.5">
                        {plan.notIncluded.map((item) => (
                          <p key={item} className="flex items-center gap-2 text-xs text-muted">
                            <X className="h-3 w-3 shrink-0" />
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    href="/dashboard"
                    className={`mt-8 inline-flex h-12 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      plan.featured
                        ? "bg-primary text-white shadow-lg shadow-primary/40 hover:bg-primary-light"
                        : "border border-border text-foreground hover:border-primary/50 hover:bg-surface-light"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-b from-surface-lighter to-surface p-10 text-center sm:p-16">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/30 blur-[100px]" />
              <h2 className="relative text-4xl font-bold tracking-tight sm:text-5xl">
                Ready to Transform Your{" "}
                <span className="text-gradient">Workflow?</span>
              </h2>
              <p className="relative mx-auto mt-5 max-w-xl text-lg text-muted">
                Join thousands of teams building faster with Can't Decide GPT. Your first
                steps are free.
              </p>
              <div className="relative mt-10">
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-10 py-4 text-base font-semibold text-white shadow-xl shadow-primary/40 transition-all hover:bg-primary-light hover:shadow-primary/60"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold">Can't Decide GPT</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <p className="text-sm text-muted">
            © 2026 Can't Decide GPT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">Can't Decide GPT</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-light"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}