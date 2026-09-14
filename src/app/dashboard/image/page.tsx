'use client'

import { useState } from 'react'
import { ImageIcon, Download, Copy, Sparkles } from 'lucide-react'

const styles = [
  { id: 'realistic', label: 'Realistic', icon: 'PhotographIcon' },
  { id: 'abstract', label: 'Abstract', icon: 'PaletteIcon' },
  { id: 'digital-art', label: 'Digital Art', icon: 'BrushIcon' },
  { id: 'sketch', label: 'Sketch', icon: 'PencilIcon' },
]

const sizes = ['512x512', '768x768', '1024x1024']

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [size, setSize] = useState('512x512')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{ prompt: string; image: string }[]>([])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size }),
      })
      const data = await res.json()
      setResult(data.data ?? data.image)
      setHistory((prev) => [{ prompt, image: data.data ?? data.image }, ...prev])
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
          <ImageIcon className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Image Generator</h1>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the image you want to generate..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Style</label>
          <div className="grid grid-cols-2 gap-3">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  style === s.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <Sparkles className={`w-5 h-5 mb-2 ${style === s.id ? 'text-purple-400' : 'text-zinc-400'}`} />
                <p className={`text-sm font-medium ${style === s.id ? 'text-purple-300' : 'text-zinc-300'}`}>
                  {s.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Size</label>
          <div className="flex gap-3">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  size === s
                    ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Right Panel */}
      <div className="space-y-4">
        {loading ? (
          <div className="aspect-square rounded-lg border border-zinc-700 bg-zinc-900 animate-pulse" />
        ) : result ? (
          <>
            <div className="relative aspect-square rounded-lg border border-zinc-700 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="Generated" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3">
              <a
                href={result}
                download="generated-image.png"
                className="flex-1 py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(prompt)}
                className="flex-1 py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Prompt
              </button>
            </div>
          </>
        ) : (
          <div className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-800 flex flex-col items-center justify-center gap-4">
            <ImageIcon className="w-16 h-16 text-zinc-600" />
            <p className="text-zinc-500 text-center px-8">Your creation will appear here</p>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-2">History</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setResult(item.image)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 hover:border-purple-500 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.prompt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
