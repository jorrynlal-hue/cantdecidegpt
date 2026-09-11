'use client';

import { CONTROL_MODES, CONTROL_MODE_LABELS, CONTROL_MODE_DESC, ControlMode as Mode } from '@/lib/uiol/types';

const dialColors: Record<Mode, string> = {
  human_only: 'border-gray-400/30 text-gray-300',
  ai_suggests: 'border-sky-400/40 text-sky-300',
  ai_prepares: 'border-indigo-400/40 text-indigo-300',
  human_approves: 'border-orange-400/40 text-orange-300',
  supervised: 'border-emerald-400/40 text-emerald-300',
  bounded_autonomy: 'border-rose-400/40 text-rose-300',
};

// Autonomy dial (B4): always a dial, never a switch.
export default function ControlModeDial({
  value,
  onChange,
  disabled,
}: {
  value: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {CONTROL_MODES.map((m, i) => (
        <button
          key={m}
          type="button"
          disabled={disabled}
          onClick={() => onChange(m)}
          className={`group relative rounded-lg border p-3 text-left transition-all ${
            value === m ? `${dialColors[m]} bg-white/5 ring-1 ring-current` : 'border-white/10 text-gray-400 hover:bg-white/5'
          } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <span className="mb-0.5 block text-[10px] text-gray-500">Level {i + 1}</span>
          <span className="block text-xs font-semibold">{CONTROL_MODE_LABELS[m]}</span>
          <span className="mt-1 block text-[11px] leading-snug opacity-80">{CONTROL_MODE_DESC[m]}</span>
        </button>
      ))}
    </div>
  );
}