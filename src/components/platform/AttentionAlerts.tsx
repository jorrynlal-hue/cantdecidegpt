'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BellRing, VolumeX } from 'lucide-react';
import { loadAudioPrefs, playTing, inQuietHours, prefersReducedAudio } from '@/lib/ting';

interface Attn {
  id: string;
  kind: string;
  title: string;
  link: string;
  detail?: string;
}

const ACK_KEY = 'cdg.attention.acked';

function readAck(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(ACK_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch { return {}; }
}

// "ting — ting — ting" attention alerts. Mounted once in the layout. Mostly
// quiet: it only rings when an *unacknowledged* item appears (set changes),
// never right after page load, and only after the user has interacted at all.
export default function AttentionAlerts() {
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState('Attention');
  const [muted, setMuted] = useState(false);
  const interactedRef = useRef(false);
  const rungRef = useRef('');
  const bootRef = useRef(true);

  useEffect(() => {
    const on = () => { interactedRef.current = true; };
    window.addEventListener('pointerdown', on, { once: true });
    window.addEventListener('keydown', on, { once: true });
    const onPrefs = () => { setMuted(!loadAudioPrefs().enabled); };
    window.addEventListener('cdg-audio-prefs', onPrefs);
    const t0 = setTimeout(() => setMuted(!loadAudioPrefs().enabled), 100);
    return () => {
      clearTimeout(t0);
      window.removeEventListener('pointerdown', on);
      window.removeEventListener('keydown', on);
      window.removeEventListener('cdg-audio-prefs', onPrefs);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const scan = async () => {
      if (!alive) return;
      try {
        const [ap, ex, tk] = await Promise.all([
          fetch('/api/db/approvals', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/db/executions', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/db/tasks', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ data: [] })),
        ]);
        const items: Attn[] = [];
        for (const a of (ap.data ?? []) as Array<{ id: string; title?: string; detail?: string }>) {
          items.push({ id: `approval-${a.id}`, kind: 'Approval', title: a.title ?? 'Approval waiting', link: '/dashboard/executive', detail: a.detail });
        }
        for (const e of (ex.data ?? []) as Array<{ id: string; status?: string; trigger?: string }>) {
          if (e.status === 'failed') items.push({ id: `exec-${e.id}`, kind: 'Run failed', title: `${e.trigger ?? 'Automation run'} failed`, link: '/dashboard/aiworker' });
        }
        for (const t of (tk.data ?? []) as Array<{ id: string; title?: string; status?: string; dueDate?: string }>) {
          const open = t.status && t.status !== 'completed' && t.status !== 'cancelled';
          const overdue = t.dueDate && new Date(t.dueDate).getTime() < Date.now() - 86400000;
          if (open && overdue) items.push({ id: `task-${t.id}`, kind: 'Overdue task', title: t.title ?? 'Task overdue', link: '/dashboard/tasks', detail: `due ${t.dueDate}` });
        }

        const ack = readAck();
        const now = Date.now();
        const unacked = items.filter((i) => {
          const until = ack[i.id];
          const silent = until !== undefined && (until === 0 || until > now);
          return !silent;
        });
        const unackedIds = unacked.map((i) => i.id).sort().join('|');
        setCount(unacked.length);
        if (unacked.length > 0) setLabel(`${unacked[0].kind} · ${unacked[0].title}`);

        // Ring only when the acked set changes, never at boot, only after a
        // user interaction, and never inside quiet hours.
        if (!bootRef.current && unacked.length > 0 && interactedRef.current) {
          if (rungRef.current !== unackedIds) {
            rungRef.current = unackedIds;
            const prefs = loadAudioPrefs();
            if (prefs.enabled && !inQuietHours(prefs) && !prefersReducedAudio()) {
              playTing({ volume: prefs.volume });
              if (prefs.browserNotify && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try { new Notification('CAN\u2019T DECIDE GPT — attention needed', { body: `${unacked.length} item(s) waiting: ${label}` }); } catch { /* blocked by browser */ }
              }
            }
          }
        } else if (unacked.length === 0) {
          rungRef.current = '';
        }
      } catch { /* transient fetch error — retry next cycle */ }
      bootRef.current = false;
      if (alive) timer = setTimeout(scan, 30000);
    };

    void scan();
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Link
        href="/dashboard/attention"
        className="flex items-center gap-2.5 rounded-xl border border-amber-400/30 bg-[#241c05]/95 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_14px_rgba(245,158,11,0.18)] backdrop-blur transition-transform hover:scale-[1.02]"
        title="Open Attention Required"
      >
        {muted ? <VolumeX className="h-4 w-4 shrink-0 text-amber-300/70" /> : <BellRing className="h-4 w-4 shrink-0 text-amber-300" />}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
        </span>
        <span className="text-xs font-semibold text-amber-100">{count} need attention</span>
        <span className="ml-1 hidden max-w-[180px] truncate text-[10px] text-amber-200/70 sm:block">{label}</span>
      </Link>
    </div>
  );
}