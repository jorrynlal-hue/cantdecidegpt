'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, Handshake, Sparkles, Share2, ArrowRight, Loader2 } from 'lucide-react';
import { useSession } from '@/components/platform/SessionProvider';

type Path = 'find' | 'build';

export default function OnboardPage() {
  const router = useRouter();
  const { me } = useSession();
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState<Path | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/onboard')
      .then((r) => r.json())
      .then((j: { preferredPath?: string | null }) => {
        if (!alive) return;
        if (j.preferredPath === 'find') {
          router.replace('/dashboard/board');
          return;
        }
        if (j.preferredPath === 'build') {
          router.replace('/dashboard/projects');
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, [router]);

  async function choose(path: Path) {
    setSaving(path);
    setError(null);
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      const j = (await res.json()) as { ok?: boolean; preferredPath?: string; error?: { code?: string; message?: string } };
      if (!res.ok || !j.ok) throw new Error(j.error?.message ?? 'Could not save your choice.');
      router.push(path === 'find' ? '/dashboard/board' : '/dashboard/projects');
    } catch (e) {
      setError((e as Error).message);
      setSaving(null);
    }
  }

  if (checking) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--c-accent-text)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--c-accent-text)]">Welcome{me?.user?.name ? `, ${me.user.name.split(' ')[0]}` : ''}</p>
        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
          How should we set up your dashboard?
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Two ways to use this system, and one shared workboard that connects them.
          This is how we bring human brains back to the high points — pick the path that fits you today.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          onClick={() => choose('find')}
          disabled={saving !== null}
          className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left backdrop-blur transition-all hover:border-[var(--c-accent-border)] hover:bg-white/[0.06] disabled:opacity-60"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] border border-[var(--c-accent-border)]">
            <Handshake className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">Finding work</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            You are the human brain a business needs. Register the field you are good at —
            design, coding, writing, marketing, sales, finance, support, operations —
            and add your resume, your details, your email and your socials.
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
            <li>• Your profile shows to every business on the workboard</li>
            <li>• They connect with you directly — you chat, even by voice</li>
            <li>• Your dashboard helps you manage every offer in one place</li>
          </ul>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--c-accent-text)] group-hover:underline">
            {saving === 'find' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Set up for finding work <ArrowRight className="h-4 w-4" /></>}
          </span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onClick={() => choose('build')}
          disabled={saving !== null}
          className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left backdrop-blur transition-all hover:border-[var(--c-accent-border)] hover:bg-white/[0.06] disabled:opacity-60"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--c-accent-soft)] text-[var(--c-accent-text)] border border-[var(--c-accent-border)]">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">Building work</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            You are starting, running or growing a business. Plan your projects, hire real
            humans from the workboard, and let the system do the heavy AI work for you.
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
            <li>• Start with projects, customers, tasks and money in one place</li>
            <li>• Post the work you need and let work finders connect with you</li>
            <li>• The $1,600 plan sets your customers up for you — $1,000s of setup inside</li>
          </ul>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--c-accent-text)] group-hover:underline">
            {saving === 'build' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Set up for building work <ArrowRight className="h-4 w-4" /></>}
          </span>
        </motion.button>
      </div>

      {error ? <p className="mt-5 text-center text-sm text-rose-400">{error}</p> : null}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 rounded-2xl border border-[var(--c-accent-border)] bg-[var(--c-accent-soft)] p-5"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--c-accent-text)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--c-accent-text)]">Two sides, one system — the more humans, the more it works</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">
              Finding work only pays off when businesses are here building work, and the other way round —
              so the system is built to grow as one connected community. You can switch your path later
              from Settings. Invite a designer, a coder, an operator and a new business owner. Share{' '}
              {'CAN’T DECIDE GPT'} and become a valuable user now — bring our human brains back to the high points.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-gray-300">
            <Share2 className="h-3.5 w-3.5 text-[var(--c-accent-text)]" /> Share to grow the workboard
          </span>
          <span className="inline-flex items-center rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-gray-300">
            Switch your path anytime
          </span>
        </div>
      </motion.div>
    </div>
  );
}