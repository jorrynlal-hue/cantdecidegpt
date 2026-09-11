'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/8 bg-[#101018] ${className}`}>{children}</div>;
}

export function CardHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-white/5">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {sub ? <p className="text-xs text-gray-500 mt-0.5">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, hint, tone = 'default' }: { label: string; value: ReactNode; hint?: string; tone?: 'default' | 'good' | 'warn' | 'accent' }) {
  const tones: Record<string, string> = {
    default: 'text-white',
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    accent: 'text-purple-400',
  };
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </Card>
  );
}

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'purple' | 'green' | 'amber' | 'red' | 'blue' }) {
  const tones: Record<string, string> = {
    gray: 'bg-white/8 text-gray-300 border-white/10',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    red: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    blue: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${tones[tone]}`}>{children}</span>;
}

export function Btn({ children, onClick, kind = 'primary', small, disabled, type = 'button', className = '' }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'outline' | 'solid' | 'ghost' | 'danger'; small?: boolean; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  const kinds = {
    primary: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500/40',
    solid: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500/40',
    outline: 'bg-transparent hover:bg-white/5 text-gray-200 border-white/15',
    ghost: 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10',
    danger: 'bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border-rose-600/30',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${small ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${kinds[kind]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ value, onChange, readOnly, placeholder, type = 'text', className = '' }: { value?: string; onChange?: (v: string) => void; readOnly?: boolean; placeholder?: string; type?: string; className?: string }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 ${className}`}
    />
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3, className = '' }: { value?: string; onChange?: (v: string) => void; placeholder?: string; rows?: number; className?: string }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-y ${className}`}
    />
  );
}

export function Select({ value, onChange, options, className = '' }: { value?: string; onChange?: (v: string) => void; options: { label: string; value: string }[]; className?: string }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      className={`rounded-lg border border-white/10 bg-[#0b0b12] px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0b0b12]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <p className="text-sm font-medium text-gray-400">{title}</p>
      {hint ? <p className="mt-1 text-xs text-gray-600 max-w-sm">{hint}</p> : null}
    </div>
  );
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${className}`}>{children}</th>;
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 text-sm text-gray-300 ${className}`}>{children}</td>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
      {label ? <span className="text-xs">{label}</span> : null}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-16" onClick={onClose}>
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-xl border border-white/10 bg-[#11111a] shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = [], initial?: T) {
  const [data, setData] = useState<T | undefined>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => {
        if (alive) setLoading(true);
      })
      .then(fn)
      .then((d) => {
        if (alive) {
          setData(d);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading, error, setData };
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function money(n: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);
}