'use client';

import { useState } from 'react';
import { BarChart3, Heart, Users, Key, Gauge, Copy, Check, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const analysisTypes = [
  { id: 'sentiment', label: 'Sentiment Analysis', icon: Heart },
  { id: 'entities', label: 'Named Entities', icon: Users },
  { id: 'keywords', label: 'Keyword Extraction', icon: Key },
  { id: 'readability', label: 'Readability Score', icon: Gauge },
];

export default function AnalyzePage() {
  const [inputText, setInputText] = useState('');
  const [analysisType, setAnalysisType] = useState('sentiment');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, type: analysisType }),
      });
      const data = await res.json();
      setResult(data.data ?? data.result ?? data.analysis ?? 'No analysis results.');
    } catch {
      setResult('Failed to analyze text. Please try again.');
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
    <div className="min-h-screen p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Data Analysis</h1>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Input text to analyze</label>
              <textarea
                rows={10}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type the text you want to analyze..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Analysis Type</label>
              <div className="grid grid-cols-2 gap-2">
                {analysisTypes.map((at) => {
                  const Icon = at.icon;
                  return (
                    <button
                      key={at.id}
                      onClick={() => setAnalysisType(at.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        analysisType === at.id
                          ? 'border-purple-500/50 bg-purple-500/20 text-purple-300'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {at.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !inputText.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Analysis Results</h2>
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
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
                <p className="text-sm text-gray-500">Running analysis...</p>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          )}

          {!loading && !result && (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <BarChart3 className="h-10 w-10 text-gray-700" />
                <p className="text-sm text-gray-600">Analysis results will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
