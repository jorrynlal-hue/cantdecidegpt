'use client';

import { useState } from 'react';
import { Mic, FileText, Languages, AlignLeft, Copy, Check, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const actions = [
  { id: 'transcribe', label: 'Transcribe', icon: FileText },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'summarize', label: 'Summarize', icon: AlignLeft },
];

export default function VoicePage() {
  const [inputText, setInputText] = useState('');
  const [action, setAction] = useState('transcribe');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);

  const wordCount = result ? result.split(/\s+/).filter(Boolean).length : 0;
  const estimatedDuration = wordCount > 0 ? Math.ceil(wordCount / 150) : 0;

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioText: inputText, action }),
      });
      const data = await res.json();
      setResult(data.result || data.output || 'No output generated.');
    } catch {
      setResult('Failed to process audio text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-6 lg:p-8">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Voice-to-Text</h1>
          </div>
          <button
            onClick={() => setRecording(!recording)}
            className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              recording
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${recording ? 'animate-pulse bg-red-500' : 'bg-gray-600'}`} />
            {recording ? 'Recording...' : 'Start Recording'}
            {recording && (
              <span className="absolute -top-1 -right-1 h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Paste or type your audio transcript</label>
              <textarea
                rows={8}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type your audio transcript..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Action</label>
              <div className="grid grid-cols-3 gap-2">
                {actions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAction(a.id)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        action === a.id
                          ? 'border-purple-500/50 bg-purple-500/20 text-purple-300'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={loading || !inputText.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? 'Processing...' : 'Process'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Output</h2>
            {result && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-all hover:bg-white/10"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {loading && (
            <div className="flex h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
                <p className="text-sm text-gray-500">Processing your audio...</p>
              </div>
            </div>
          )}

          {!loading && result && (
            <>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
                <span>{wordCount} words</span>
                <span className="text-gray-700">|</span>
                <span>~{estimatedDuration} min read</span>
              </div>
            </>
          )}

          {!loading && !result && (
            <div className="flex h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <Mic className="h-10 w-10 text-gray-700" />
                <p className="text-sm text-gray-600">Processed audio content will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
