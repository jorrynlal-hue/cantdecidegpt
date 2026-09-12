'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, CircleDot, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { useCollection } from '@/components/platform/data';
import { CORE } from '@/lib/radial01';
import { loadAudioPrefs, inQuietHours } from '@/lib/ting';

interface Execution { id: string; status: string; verified?: boolean; startedAt: string; }
interface Generation { id: string; createdAt: string; }
interface Task { id: string; status: string; }

export default function StatusBar() {
  const executions = useCollection<Execution>('executions', {});
  const generations = useCollection<Generation>('generations', {});
  const tasks = useCollection<Task>('tasks', {});

  const running = executions.rows.filter((e) => ['queued', 'running', 'waiting'].includes(e.status)).length;
  const failed = executions.rows.filter((e) => e.status === 'failed').length;
  const openTasks = tasks.rows.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;

  const stamps = [...generations.rows.map((g) => g.createdAt), ...executions.rows.map((e) => e.startedAt)].filter(Boolean);
  const lastSync = stamps.length ? new Date(Math.max(...stamps.map((s) => new Date(s).getTime()))).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  const [audio, setAudio] = useState(() => loadAudioPrefs());
  useEffect(() => {
    const onPrefs = () => setAudio(loadAudioPrefs());
    window.addEventListener('cdg-audio-prefs', onPrefs);
    return () => window.removeEventListener('cdg-audio-prefs', onPrefs);
  }, []);
  const quiet = inQuietHours(audio);
  const audioLabel = !audio.enabled ? 'alerts muted' : quiet ? `quiet until ${audio.quietTo}` : `alerts at ${audio.volume}%`;

  return (
    <footer className="h-8 shrink-0 border-t border-white/5 bg-[#0D1117]/90 text-[10px] text-gray-500">
      <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-4 min-w-0">
          <span className="flex items-center gap-1.5 text-[#00D9B2]">
            <span className="status-pulse h-1.5 w-1.5 rounded-full bg-[#00D9B2]" />
            {CORE.short} connected
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <CircleDot className="h-3 w-3 text-[#19C9D6]" /> 34 tools synced
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-[#9B6CFF]" /> {running} active job{running === 1 ? '' : 's'}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-gray-600" /> {openTasks} open task{openTasks === 1 ? '' : 's'}
          </span>
          {failed > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="h-3 w-3" /> {failed} warning{failed === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden md:flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 text-gray-600" />
            {executions.loading ? 'syncing…' : `last sync ${lastSync ?? '—'}`}
          </span>
          <span className="flex items-center gap-1.5">
            {audio.enabled ? <Volume2 className={`h-3 w-3 ${quiet ? 'text-purple-300' : 'text-emerald-400'}`} /> : <VolumeX className="h-3 w-3 text-gray-500" />}
            <span className={audio.enabled && !quiet ? 'text-emerald-400/90' : 'text-gray-500'}>{audioLabel}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#00D9B2]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D9B2]" /> All systems nominal
          </span>
        </div>
      </div>
      <style jsx>{`
        .status-pulse { animation: statusPulse 2.4s ease-in-out infinite; }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,217,178,0.5); }
          50% { opacity: 0.6; box-shadow: 0 0 0 5px rgba(0,217,178,0); }
        }
      `}</style>
    </footer>
  );
}