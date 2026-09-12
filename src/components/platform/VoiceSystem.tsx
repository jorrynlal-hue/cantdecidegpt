'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Settings, Sparkles } from 'lucide-react';
import {
  createRecognition,
  matchVoiceNav,
  splitAfterWake,
  wakeWordsOf,
  cleanSpeech,
  speak,
  stopSpeaking,
  speaking,
  voiceBeep,
  voiceSupported,
  primeSpeechVoices,
  readConversationId,
  saveConversationId,
  type SpeechRecognitionLike,
} from '@/lib/voice';
import { loadAudioPrefs } from '@/lib/ting';
import { ai } from '@/lib/core/client';

type Phase = 'off' | 'armed' | 'woken' | 'busy';

const LABELS: Record<Phase, string> = {
  off: 'Voice off',
  armed: 'Listening…',
  woken: 'Listening…',
  busy: 'Working…',
};

export default function VoiceSystem() {
  const router = useRouter();
  const [prefs, setPrefs] = useState(() => (typeof window === 'undefined' ? null : loadAudioPrefs()));
  const supported = voiceSupported();
  const [phase, setPhase] = useState<Phase>('off');
  const [on, setOn] = useState(false);
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const phaseRef = useRef<Phase>('off');
  const onRef = useRef(false);
  const wakeRef = useRef<string[]>([]);
  const consumedRef = useRef(0);
  const restartTimer = useRef<number | null>(null);

  const setPh = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const handleUtterance = (block: string) => {
    if (block === '') return;
    setHeard(block);
    const ph = phaseRef.current;
    if (ph === 'busy') return; // barge-in already cut the reply; ignore content
    if (ph === 'woken') {
      processCommand(block);
      return;
    }
    const cmd = splitAfterWake(block, wakeRef.current);
    if (cmd !== null) {
      voiceBeep();
      if (cmd) {
        processCommand(cmd);
      } else {
        setPh('woken');
        speak('Ready, go ahead.');
      }
    }
    // anything else while armed is ignored — we wait for the wake word
  };

  const startRecognition = () => {
    if (recRef.current || !onRef.current) return;
    const rec = createRecognition();
    if (!rec) {
      setError('Voice is not supported in this browser. Use Chrome or Edge.');
      setPh('off');
      return;
    }
    recRef.current = rec;
    rec.onresult = (e) => {
      if (speaking()) stopSpeaking(); // barge-in
      for (let i = consumedRef.current; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r || !r.length || !r.isFinal) continue; // wait for phrase end
        consumedRef.current = i + 1;
        handleUtterance(r[0]?.transcript ?? '');
      }
    };
    rec.onstart = () => {
      if (phaseRef.current === 'off') setPh('armed');
    };
    rec.onerror = (ev) => {
      const err = ev?.error ?? '';
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        onRef.current = false;
        setOn(false);
        setPh('off');
        setError('Microphone blocked. Allow mic access in your browser, then toggle voice on.');
      } else if (err === 'aborted') {
        // we stopped it deliberately
      } else if (err === 'no-speech') {
        // transient — keep listening
      } else if (err) {
        setError(`Voice error: ${err}`);
      }
    };
    rec.onend = () => {
      recRef.current = null;
      consumedRef.current = 0;
      if (onRef.current) {
        // Chrome sometimes halts continuous mode; restart gently.
        if (restartTimer.current) window.clearTimeout(restartTimer.current);
        restartTimer.current = window.setTimeout(() => {
          restartTimer.current = null;
          if (onRef.current && !recRef.current) startRecognition();
        }, 400);
      } else {
        setPh('off');
      }
    };
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setError('Could not start the microphone.');
    }
  };

  const stopRecognition = () => {
    if (restartTimer.current) { window.clearTimeout(restartTimer.current); restartTimer.current = null; }
    onRef.current = false;
    stopSpeaking();
    try { recRef.current?.abort(); } catch { /* noop */ }
    recRef.current = null;
    consumedRef.current = 0;
  };

  const processCommand = async (text: string) => {
    setPh('busy');
    setReply('');
    setError('');
    setHeard(text);
    const nav = matchVoiceNav(text);
    if (nav) {
      setReply(`Opening ${nav.label}`);
      speak(`Opening ${nav.label}.`);
      window.setTimeout(() => router.push(nav.href), 250);
      setPh('armed');
      return;
    }
    try {
      const res = await ai.assistantChat(text, readConversationId() ?? undefined);
      const conv = res?.conversation as { id?: unknown } | null | undefined;
      saveConversationId(typeof conv?.id === 'string' ? conv.id : null);
      const body = res?.reply ?? '';
      setReply(body);
      speak(cleanSpeech(body) || 'I heard you. Try asking me to create a task, summarize a document, or open a tool.');
    } catch {
      setError('The assistant could not respond.');
      speak('Sorry, I could not reach the assistant.');
    }
    if (phaseRef.current === 'busy') setPh('armed');
  };

  // Prefs live-update (settings page dispatches cdg-audio-prefs)
  useEffect(() => {
    const sync = () => {
      const p = loadAudioPrefs();
      wakeRef.current = wakeWordsOf(p.wakeWord);
      if (p.voiceEnabled && supported) {
        if (!onRef.current) {
          onRef.current = true;
          window.setTimeout(() => { startRecognition(); setOn(true); }, 0);
        }
      } else if (onRef.current) {
        window.setTimeout(() => { stopRecognition(); setOn(false); setHeard(''); setReply(''); setError(''); }, 0);
      }
      window.setTimeout(() => setPrefs(p), 0);
    };
    sync();
    window.addEventListener('cdg-audio-prefs', sync);
    return () => window.removeEventListener('cdg-audio-prefs', sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut: Ctrl+Shift+V toggles the session mic.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey || e.key.toLowerCase() !== 'v') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      if (onRef.current) {
        stopRecognition();
        setOn(false);
        setPh('off');
      } else if (prefs?.voiceEnabled) {
        onRef.current = true;
        setOn(true);
        startRecognition();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  useEffect(() => () => stopRecognition(), []);

  if (!supported) return null;
  const masterOn = Boolean(prefs?.voiceEnabled);
  const talking = speaking();

  const toggle = () => {
    setError('');
    if (onRef.current) {
      stopRecognition();
      setOn(false);
      setPh('off');
      setHeard('');
      setReply('');
    } else {
      onRef.current = true;
      setOn(true);
      startRecognition();
    }
  };

  return (
    <div className="fixed bottom-14 left-3 z-[80] flex flex-col items-start gap-1.5">
      <div
        className={`flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-2xl backdrop-blur transition-all ${
          !masterOn
            ? 'border-white/10 bg-[#12121a]/90'
            : on
              ? 'border-[#FF5A91]/40 bg-[#1b1119]/95 shadow-[0_0_24px_rgba(255,90,145,0.25)]'
              : 'border-white/10 bg-[#12121a]/90'
        }`}
      >
        {!masterOn ? (
          <button onClick={() => router.push('/dashboard/settings')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            title="Enable the voice assistant in Settings">
            <Mic className="h-4 w-4" />
            <span className="text-[11px] font-medium">Voice off — enable in Settings</span>
          </button>
        ) : (
          <button onClick={toggle} title="Voice assistant (Ctrl+Shift+V)"
            className="flex items-center gap-2 transition-opacity hover:opacity-80">
            {on ? <Mic className="h-4 w-4 text-[#FF5A91]" /> : <MicOff className="h-4 w-4 text-gray-400" />}
            <span className={`text-[11px] font-medium ${on ? 'text-[#F2B4C9]' : 'text-gray-400'}`}>
              {on ? LABELS[phase] : 'Voice off'}
            </span>
            {on && (
              <span className="flex items-end gap-[2px]" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`w-[3px] rounded-full ${phase === 'off' ? 'bg-gray-600' : 'bg-[#FF5A91]'}`}
                    style={{
                      height: phase === 'busy' ? `${4 + ((i * 3 + 2) % 5)}px` : `${4 + ((i + Math.round(phase === 'armed' ? 2 : 1)) % 4)}px`,
                      animation: on ? `eqbar 0.9s ease-in-out ${i * 0.12}s infinite alternate` : 'none',
                    }} />
                ))}
              </span>
            )}
            {talking && <Sparkles className="h-3.5 w-3.5 text-[#20DDB1]" />}
            <Link href="/dashboard/settings" onClick={(e) => e.stopPropagation()} title="Voice settings"
              className="ml-0.5 text-gray-500 hover:text-white" aria-label="Voice settings">
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </button>
        )}
      </div>

      {(heard || reply || error) && (
        <div className="max-w-[260px] rounded-xl border border-white/10 bg-[#0b0f18]/95 p-2 text-[10.5px] leading-relaxed shadow-2xl backdrop-blur">
          {heard && <p className="text-gray-300"><span className="text-gray-500">heard:</span> “{heard.slice(0, 80)}”</p>}
          {reply && <p className="text-[#F2B4C9]"><span className="text-gray-500">→</span> {reply.slice(0, 140)}</p>}
          {error && <p className="text-amber-400">{error}</p>}
        </div>
      )}

      <style jsx>{`
        @keyframes eqbar {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}