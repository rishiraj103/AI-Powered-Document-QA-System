import { useState, useRef } from 'react'
import axios from 'axios'

// ── Small reusable components ────────────────────────────────────────────────

/** Spinner shown while loading */
function Spinner() {
  return (
    <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span className="text-sm font-medium">Processing…</span>
    </div>
  )
}

/** A single retrieved source chunk card */
function SourceCard({ source, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-750 transition-colors"
      >
        <span className="text-sm font-medium text-gray-300">
          Chunk {index + 1} &mdash;{' '}
          <span className="text-indigo-400">{source.source}</span>
          {source.page !== '?' && (
            <span className="ml-2 text-gray-500 text-xs">page {source.page}</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-xs text-gray-400 leading-relaxed whitespace-pre-wrap border-t border-gray-700">
          {source.content}
        </div>
      )}
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Upload state
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)  // { type: 'success'|'error', text }
  const fileInputRef = useRef(null)

  // Query state
  const [question, setQuestion] = useState('')
  const [querying, setQuerying] = useState(false)
  const [answer, setAnswer] = useState(null)   // string
  const [sources, setSources] = useState([])   // array of source objects
  const [queryError, setQueryError] = useState(null)

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleFileChange(e) {
    setFiles(Array.from(e.target.files))
    setUploadMsg(null)
  }

  async function handleUpload() {
    if (files.length === 0) return
    setUploading(true)
    setUploadMsg(null)

    const form = new FormData()
    files.forEach(f => form.append('files', f))

    try {
      const res = await axios.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadMsg({ type: 'success', text: `✓ ${res.data.files.join(', ')} indexed successfully.` })
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      const detail = err.response?.data?.detail || 'Upload failed.'
      setUploadMsg({ type: 'error', text: `✗ ${detail}` })
    } finally {
      setUploading(false)
    }
  }

  async function handleQuery() {
    if (!question.trim()) return
    setQuerying(true)
    setAnswer(null)
    setSources([])
    setQueryError(null)

    try {
      const res = await axios.post('/query', { question })
      setAnswer(res.data.answer)
      setSources(res.data.sources)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Query failed.'
      setQueryError(detail)
    } finally {
      setQuerying(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-lg select-none">
            📄
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">RAG Document QA</h1>
            <p className="text-xs text-gray-500 mt-0.5">Ask questions about your PDFs</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* ── Upload Section ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            1. Upload PDFs
          </h2>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
            {/* Drop zone / file input */}
            <label
              htmlFor="pdf-input"
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-600 rounded-lg py-8 cursor-pointer hover:border-indigo-500 hover:bg-gray-800 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
              </svg>
              <span className="text-sm text-gray-400">
                {files.length > 0
                  ? files.map(f => f.name).join(', ')
                  : 'Click to select PDF(s)'}
              </span>
              <input
                id="pdf-input"
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Upload button */}
            <button
              id="upload-btn"
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            >
              {uploading ? 'Uploading…' : 'Upload & Index'}
            </button>

            {/* Upload status */}
            {uploading && <Spinner />}
            {uploadMsg && (
              <p className={`text-sm ${uploadMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {uploadMsg.text}
              </p>
            )}
          </div>
        </section>

        {/* ── Query Section ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            2. Ask a Question
          </h2>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
            <textarea
              id="question-input"
              rows={3}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question and press Enter or click Ask…"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              id="ask-btn"
              onClick={handleQuery}
              disabled={!question.trim() || querying}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            >
              {querying ? 'Thinking…' : 'Ask'}
            </button>
            {querying && <Spinner />}
          </div>
        </section>

        {/* ── Answer Section ───────────────────────────────────────────── */}
        {(answer || queryError) && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Answer
            </h2>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              {queryError ? (
                <p className="text-red-400 text-sm">{queryError}</p>
              ) : (
                <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
              )}
            </div>
          </section>
        )}

        {/* ── Sources Section ──────────────────────────────────────────── */}
        {sources.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Retrieved Chunks ({sources.length})
            </h2>
            <div className="space-y-3">
              {sources.map((src, i) => (
                <SourceCard key={i} source={src} index={i} />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-600 border-t border-gray-800 mt-8">
        RAG QA System &mdash; University Project
      </footer>
    </div>
  )
}
