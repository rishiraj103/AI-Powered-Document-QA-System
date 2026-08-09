import { Clock3 } from 'lucide-react'

export default function QueryHistory({ history, onSelect }) {
  if (!history.length) return null
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-center gap-2"><Clock3 size={14} className="text-zinc-500" /><p className="section-kicker">Recent questions</p></div>
      <div className="mt-3 space-y-1">
        {history.slice(0, 5).map(item => <button key={item} className="history-item" onClick={() => onSelect(item)}>{item}</button>)}
      </div>
    </section>
  )
}
