'use client';

import { EXECUTION_MODES, EXECUTION_MODE_META, ExecutionMode as Mode } from '@/lib/uiol/layer';

const modeColors: Record<Mode, string> = {
  ai_only: 'border-sky-400/40 text-sky-300',
  ai_to_human: 'border-indigo-400/40 text-indigo-300',
  human_to_ai: 'border-orange-400/40 text-orange-300',
  ai_and_human: 'border-emerald-400/40 text-emerald-300',
  auto: 'border-purple-400/50 text-purple-300',
};

// Execution Control (strategy flagship): who does the work — AI, a human, or both.
// Auto (★) lets the system decide per step. Maps onto the autonomy dial underneath.
export default function ExecutionControl({
  value,
  onChange,
  disabled,
  showRecommended,
}: {
  value: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
  showRecommended?: boolean;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {EXECUTION_MODES.map((m) => {
          const meta = EXECUTION_MODE_META[m];
          const star = m === 'auto';
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => onChange(m)}
              className={`group relative rounded-lg border p-3 text-left transition-all ${
                value === m ? `${modeColors[m]} bg-white/5 ring-1 ring-current` : 'border-white/10 text-gray-400 hover:bg-white/5'
              } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              {star && showRecommended && (
                <span className="absolute -top-2 left-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                  Recommended
                </span>
              )}
              <span className="mb-1 block text-xs font-semibold">
                {star ? <span className="mr-0.5 text-amber-300">★</span> : null}
                {meta.label}
              </span>
              <span className="mt-1 block text-[11px] leading-snug opacity-80">{meta.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}