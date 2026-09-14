'use client'

import { useState } from 'react'
import { Languages, ArrowLeftRight, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const languages = [
  'English', 'Spanish', 'French', 'German', 'Japanese',
  'Chinese', 'Portuguese', 'Italian', 'Korean', 'Arabic',
  'Hindi', 'Russian',
]

export default function TranslatePage() {
  const [inputText, setInputText] = useState('')
  const [fromLanguage, setFromLanguage] = useState('English')
  const [toLanguage, setToLanguage] = useState('Spanish')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSwap = () => {
    setFromLanguage(toLanguage)
    setToLanguage(fromLanguage)
    if (result) {
      setInputText(result)
      setResult('')
    }
  }

  const handleTranslate = async () => {
    if (!inputText.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, from: fromLanguage, to: toLanguage }),
      })
      const data = await res.json()
      setResult(data.data ?? data.translation)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Languages className="w-6 h-6 text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Translator</h1>
      </div>

      {/* Language Selectors */}
      <div className="flex items-center gap-3">
        <select
          value={fromLanguage}
          onChange={(e) => setFromLanguage(e.target.value)}
          className="flex-1 py-3 px-4 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <button
          onClick={handleSwap}
          className="p-3 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        <select
          value={toLanguage}
          onChange={(e) => setToLanguage(e.target.value)}
          className="flex-1 py-3 px-4 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Input */}
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows={8}
        placeholder="Enter text to translate..."
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
      />

      {/* Translate Button */}
      <button
        onClick={handleTranslate}
        disabled={loading || !inputText.trim()}
        className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Translating...
          </>
        ) : (
          'Translate'
        )}
      </button>

      {/* Result */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300">Result</h2>
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
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: `${100 - i * 20}%` }} />
            ))}
          </div>
        ) : result ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed mb-3">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Translation complete — {fromLanguage} → {toLanguage}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 h-32 flex items-center justify-center">
            <p className="text-zinc-500">Translation will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
