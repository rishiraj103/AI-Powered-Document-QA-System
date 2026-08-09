import { forwardRef } from 'react'
import { ArrowUp, LoaderCircle, Search, X } from 'lucide-react'

const suggestions = ['What is the main objective?', 'Summarize the methodology', 'What are the key findings?', 'What limitations are mentioned?']

const QuestionInput = forwardRef(function QuestionInput({ value, querying, onChange, onSubmit, onClear }, ref) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><Search size={16} className="text-violet-400" /> Ask your documents</div>
      <div className="composer mt-4">
        <textarea
          ref={ref}
          rows={4}
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={querying}
          maxLength={4000}
          aria-label="Question about your documents"
          placeholder="Ask a question about your indexed documents…"
          className="composer-input"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          <span className="hidden text-[11px] text-zinc-600 sm:block">Enter to ask · Shift + Enter for a new line</span>
          <span className="text-[11px] text-zinc-700 sm:hidden">{value.length}/4000</span>
          <div className="ml-auto flex items-center gap-2">
            {value && <button className="icon-button h-9 w-9" onClick={onClear} disabled={querying} aria-label="Clear question"><X size={15} /></button>}
            <button className="ask-button" onClick={onSubmit} disabled={!value.trim() || querying} aria-label="Ask question">
              {querying ? <LoaderCircle className="animate-spin" size={16} /> : <ArrowUp size={16} />}<span>{querying ? 'Thinking' : 'Ask'}</span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Try asking</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map(suggestion => <button key={suggestion} className="suggestion-chip" onClick={() => { onChange(suggestion); window.requestAnimationFrame(() => ref.current?.focus()) }}>{suggestion}</button>)}
        </div>
      </div>
    </section>
  )
})

export default QuestionInput
