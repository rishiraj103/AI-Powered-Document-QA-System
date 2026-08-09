import { AlertTriangle, Bot, LoaderCircle, Quote } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Notice from './Notice'

export default function AnswerCard({ answer, sourceCount, loading, error, onRetry }) {
  if (error) return <Notice type="error" title="Unable to generate an answer" message={error} onRetry={onRetry} />
  return (
    <section className="answer-card">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3"><span className="ai-icon"><Bot size={17} /></span><div><p className="text-sm font-medium text-white">Generated response</p><p className="text-[11px] text-zinc-600">Grounded in retrieved document context</p></div></div>
        {!loading && <span className="count-badge"><Quote size={11} /> {sourceCount} sources</span>}
      </div>
      <div className="px-5 py-6 sm:px-7 sm:py-7">
        {loading ? (
          <div className="flex min-h-28 flex-col items-center justify-center text-center"><LoaderCircle className="animate-spin text-violet-400" size={22} /><p className="mt-3 text-sm text-zinc-300">Retrieving context and generating your answer…</p><p className="mt-1 text-xs text-zinc-600">This can take a moment.</p></div>
        ) : answer ? (
          <div className="answer-content"><ReactMarkdown>{answer}</ReactMarkdown></div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-300"><AlertTriangle size={16} /> No answer was returned.</div>
        )}
      </div>
    </section>
  )
}
