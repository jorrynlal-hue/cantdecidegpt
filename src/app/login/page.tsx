'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth } from '@/lib/core/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      const m = new URLSearchParams(window.location.search).get('mode');
      if (m === 'signup' || m === 'signin') return m;
    }
    return 'signin';
  });
  const [next] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const n = new URLSearchParams(window.location.search).get('next');
      if (n && n.startsWith('/') && !n.startsWith('//') && !n.includes('\\')) return n;
    }
    return null;
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'signup') {
        const r = await auth.signup(email.trim(), password, name.trim() || email.trim().split('@')[0]);
        if (r.needsVerification) {
          setNotice('Account created. Check your inbox to confirm your email, then sign in.');
          setMode('signin');
          setBusy(false);
          return;
        }
      } else {
        await auth.login(email.trim(), password);
      }
      router.push(next ?? '/dashboard/onboard');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cantdecide-gpt-logo.png" alt="CAN'T DECIDE GPT logo" className="h-14 w-14 rounded-2xl object-cover mb-3" />
          <h1 className="text-xl font-bold text-white">CAN&apos;T DECIDE GPT</h1>
          <p className="text-sm text-gray-500 mt-1">{mode === 'signin' ? 'Sign in to your workspace' : 'Create your account'}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-lg border border-white/10 overflow-hidden">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setNotice(null); }}
              className={`px-3 py-2 text-xs font-medium ${mode === m ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="rounded-xl border border-white/8 bg-[#101018] p-6 space-y-4">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                className="w-full rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 pr-10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
          {notice ? <p className="text-xs text-emerald-400">{notice}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2.5 border border-purple-500/40 transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {busy ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Return to CAN&apos;T DECIDE GPT
        </Link>
      </div>
    </div>
  );
}