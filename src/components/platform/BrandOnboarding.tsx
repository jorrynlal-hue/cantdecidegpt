'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { getBrand, setBrand } from '@/lib/theme';

const BRAND_SET = 'cdg.brand.set';

export default function BrandOnboarding() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>('');

  useEffect(() => {
    let done = true;
    try {
      done = !!localStorage.getItem(BRAND_SET);
    } catch {
      done = true;
    }
    if (!done) {
      const t = setTimeout(() => {
        setName(getBrand());
        setOpen(true);
      }, 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  if (!open) return null;

  const save = () => {
    const finalName = (name.trim() || "CAN'T DECIDE GPT").slice(0, 60);
    setBrand(finalName);
    try {
      localStorage.setItem(BRAND_SET, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-strong w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl accent-bg accent-glow">
          <Wand2 className="h-7 w-7" />
        </div>
        <h2 className="text-center text-lg font-bold text-white">Name your project brain</h2>
        <p className="mt-1.5 text-center text-xs text-gray-400">
          This is the first login. Pick a name for the whole thing — it replaces the workspace name in the sidebar, header and tools.
        </p>
        <div className="mt-5">
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-gray-500">Your name for it</label>
          <div className="relative">
            <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-accent-text)]" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CAN'T DECIDE GPT"
              maxLength={60}
              className="w-full rounded-xl border border-white/10 bg-[var(--input-bg)] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[var(--c-accent-border)]"
            />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button onClick={save} className="accent-bg accent-glow flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90">
            Use this name
          </button>
          <button
            onClick={() => {
              setOpen(false);
              try {
                localStorage.setItem(BRAND_SET, '1');
              } catch {
                /* ignore */
              }
            }}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5"
          >
            Pick later
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-gray-600">You can change it any time in Settings → Appearance.</p>
      </div>
    </div>
  );
}