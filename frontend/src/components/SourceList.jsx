import { useMemo, useState } from 'react'
import { ChevronDown, Check, Copy, FileText, Search } from 'lucide-react'

function SourceCard({ source, index }) {
  const [open, setOpen] = useState(index === 0)
  const [copied, setCopied] = useState(false)

  async function copySource(event) {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(source.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className={`source-card ${open ? 'is-open' : ''}`}>
      <div className="flex items-center gap-3 p-4 sm:px-5">
        <span className="source-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="pdf-icon"><FileText size={15} /></span>
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(value => !value)} aria-expanded={open}>
          <p className="truncate text-xs font-medium text-zinc-200">{source.source || 'Unknown document'}</p>
          <p className="mt-0.5 text-[11px] text-zinc-600">{source.page !== '?' && source.page != null ? `Page ${source.page}` : 'Page unavailable'}</p>
        </button>
        <button className={`copy-button ${copied ? 'is-copied' : ''}`} onClick={copySource} aria-label={`Copy source ${index + 1}`}>
          {copied ? <Check size={13} /> : <Copy size={13} />}<span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        <button className="icon-button h-8 w-8" onClick={() => setOpen(value => !value)} aria-label={`${open ? 'Collapse' : 'Expand'} source ${index + 1}`}><ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} size={15} /></button>
      </div>
      <div className="source-content" aria-hidden={!open}><div className="border-t border-white/[0.06] px-5 py-4 text-xs leading-6 text-zinc-400 whitespace-pre-wrap">{source.content}</div></div>
    </article>
  )
}

export default function SourceList({ sources }) {
  const [filter, setFilter] = useState('')
  const filteredSources = useMemo(() => sources.filter(source => `${source.source} ${source.page} ${source.content}`.toLowerCase().includes(filter.toLowerCase())), [sources, filter])
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="section-kicker">Evidence</p><h3 className="mt-1 text-base font-semibold text-white">Sources used <span className="font-normal text-zinc-600">({sources.length})</span></h3></div>
        {sources.length > 2 && <label className="source-search"><Search size={14} /><span className="sr-only">Search sources</span><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search sources…" /></label>}
      </div>
      <div className="mt-4 space-y-2">
        {filteredSources.map((source, index) => <SourceCard key={`${source.source}-${source.page}-${index}`} source={source} index={sources.indexOf(source)} />)}
        {!filteredSources.length && <div className="rounded-xl border border-dashed border-white/[0.07] py-8 text-center text-xs text-zinc-600">No sources match “{filter}”.</div>}
      </div>
    </section>
  )
}
