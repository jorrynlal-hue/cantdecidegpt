'use client';

import { STAGE_ORDER, STAGE_LABELS, Stage, StageStatus } from '@/lib/uiol/types';

const statusDot: Record<StageStatus, string> = {
  pending: 'bg-white/10 border-white/15 text-gray-400',
  in_progress: 'bg-purple-500 text-white border-purple-400 animate-pulse',
  completed: 'bg-emerald-500 text-white border-emerald-400',
  skipped: 'bg-white/5 border-white/10 text-gray-500 line-through',
  blocked: 'bg-red-500 text-white border-red-400',
};

export default function StageStepper({
  stage,
  stageStatus,
  onJump,
  readOnly,
}: {
  stage: Stage;
  stageStatus: Record<Stage, StageStatus>;
  onJump?: (s: Stage) => void;
  readOnly?: boolean;
}) {
  const currentIdx = STAGE_ORDER.indexOf(stage);
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-1">
        {STAGE_ORDER.map((s, i) => {
          const status = stageStatus[s];
          const reachable = i <= currentIdx || (i === currentIdx + 1 && !readOnly);
          return (
            <div key={s} className="flex items-center">
              <button
                type="button"
                disabled={!reachable || readOnly}
                onClick={() => onJump?.(s)}
                className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  status === 'in_progress' ? 'border-purple-400/40 bg-purple-500/10 text-white' : 'border-transparent'
                } ${reachable ? 'cursor-pointer hover:bg-white/5' : 'cursor-default opacity-70'}`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${statusDot[status]}`}>
                  {status === 'completed' ? '✓' : i + 1}
                </span>
                <span className="whitespace-nowrap">{STAGE_LABELS[s]}</span>
                {status === 'blocked' && <span className="text-[9px] text-red-300">!</span>}
              </button>
              {i < STAGE_ORDER.length - 1 && (
                <div className={`mx-1 h-px w-4 ${i < currentIdx ? 'bg-emerald-400/50' : 'bg-white/10'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}