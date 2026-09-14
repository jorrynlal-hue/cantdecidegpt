'use client'

import { useState, useMemo } from 'react'
import { FileText, Copy, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const lengthOptions = [
  { id: 'short', label: 'Short', desc: '~3 sentences' },
  { id: 'medium', label: 'Medium', desc: '~1 paragraph' },
  { id: 'detailed', label: 'Detailed', desc: 'Multi-paragraph' },
]

export default function SummarizePage() {
  const [inputText, setInputText] = useState('')
  const [length, setLength] = useState('medium')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const wordCount = useMemo(() => inputText.trim().split(/\s+/).filter(Boolean).length, [inputText])

  const handleSummarize = async () => {
    if (!inputText.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, length }),
      })
      const data = await res.json()
      setResult(data.data ?? data.summary)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-7xl mx-auto">
      {/* Left Panel */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Text Summarizer</h1>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Input Text</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={12}
            placeholder="Paste your text here to summarize..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">{wordCount} words</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Length</label>
          <div className="flex gap-3">
            {lengthOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLength(opt.id)}
                className={`flex-1 py-3 px-3 rounded-lg border-2 transition-all text-center ${
                  length === opt.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <p className={`text-sm font-medium ${length === opt.id ? 'text-purple-300' : 'text-zinc-300'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSummarize}
            disabled={loading || !inputText.trim()}
            className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Summarizing...
              </>
            ) : (
              'Summarize'
            )}
          </button>
          <button
            onClick={() => { setInputText(''); setResult('') }}
            className="py-3 px-4 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Summary</h2>
          {result && (
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: `${90 - i * 15}%` }} />
            ))}
          </div>
        ) : result ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 h-64 flex items-center justify-center">
            <p className="text-zinc-500">Your summary will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
