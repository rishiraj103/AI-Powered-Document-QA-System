import { Bot, FileSearch2 } from 'lucide-react'

export default function AnswerEmptyState() {
  return (
    <div className="answer-card">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <span className="ai-icon"><Bot size={17} /></span>
        <div>
          <p className="text-sm font-medium text-white">Generated response</p>
          <p className="text-[11px] text-zinc-600">Grounded in retrieved document context</p>
        </div>
      </div>
      <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
        <span className="empty-icon"><FileSearch2 size={24} /></span>
        <p className="mt-5 text-sm font-medium text-zinc-300">Your answer will appear here</p>
        <p className="mt-2 max-w-md text-xs leading-5 text-zinc-600">
          Upload your documents, ask a question above, and the grounded response will be shown here with its supporting sources.
        </p>
      </div>
    </div>
  )
}
