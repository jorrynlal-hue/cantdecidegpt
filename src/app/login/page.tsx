'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth } from '@/lib/core/client';

const demoUsers = [
  { email: 'owner@nexus.local', role: 'Owner' },
  { email: 'admin@nexus.local', role: 'Admin' },
  { email: 'manager@nexus.local', role: 'Manager' },
  { email: 'member@nexus.local', role: 'Member' },
  { email: 'viewer@nexus.local', role: 'Viewer' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@nexus.local');
  const [password, setPassword] = useState('password');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await auth.login(email.trim(), password);
      router.push('/dashboard/platform');
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Nexus Platform</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your workspace</p>
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
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 pr-10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error ? <p className="text-xs text-rose-400">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2.5 border border-purple-500/40 transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-white/5 bg-[#0d0d12] p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-2">Seed accounts (password: password)</p>
          <div className="grid gap-1">
            {demoUsers.map((u) => (
              <button
                key={u.email}
                onClick={() => {
                  setEmail(u.email);
                  setPassword('password');
                  setError(null);
                }}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-white/5 text-left"
              >
                <span className="text-gray-400">{u.email}</span>
                <span className="text-purple-300 uppercase text-[10px] tracking-wider">{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}