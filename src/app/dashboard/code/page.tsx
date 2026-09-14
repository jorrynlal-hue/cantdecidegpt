'use client';

import { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import LoadingDots from '@/components/ui/LoadingDots';

type Mode = 'generate' | 'explain' | 'debug' | 'refactor';
type Language = 'python' | 'javascript' | 'typescript' | 'rust' | 'go' | 'java' | 'cpp' | 'ruby';

const modes: { key: Mode; label: string }[] = [
  { key: 'generate', label: 'Generate' },
  { key: 'explain', label: 'Explain' },
  { key: 'debug', label: 'Debug' },
  { key: 'refactor', label: 'Refactor' },
];

const languages: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'ruby', label: 'Ruby' },
];

const placeholders: Record<Mode, string> = {
  generate: 'Describe the code you want to generate...',
  explain: 'Paste code you want explained...',
  debug: 'Paste code with a bug and describe the issue...',
  refactor: 'Paste code you want refactored...',
};

const languageMap: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  rust: 'rust',
  go: 'go',
  java: 'java',
  cpp: 'cpp',
  ruby: 'ruby',
};

export default function CodePage() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<Language>('python');
  const [mode, setMode] = useState<Mode>('generate');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResult('');

    try {
      const res = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), language, mode }),
      });

      const data = await res.json();
      setResult(data.data ?? data.code ?? data.content ?? data.result ?? 'No output received.');
    } catch {
      setResult('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[var(--bg)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto h-full">
        {/* Left Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-500" />
            <h1 className="text-lg font-semibold text-[var(--text)]">Code Generator</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m.key
                    ? 'bg-purple-500 text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-purple-500/10'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholders[mode]}
            rows={8}
            className="flex-1 min-h-[200px] px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm resize-none"
          />

          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
            className="w-full py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text)]">Generated Code</h2>
            {result && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingDots />
              </div>
            ) : result ? (
              <div className="overflow-auto max-h-[calc(100vh-280px)]">
                <SyntaxHighlighter
                  language={languageMap[language]}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    minHeight: '100%',
                  }}
                  showLineNumbers
                >
                  {result}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">
                Your generated code will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
