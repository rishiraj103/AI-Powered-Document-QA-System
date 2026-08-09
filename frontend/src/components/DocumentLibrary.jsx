import { CheckCircle2, FileText, Library } from 'lucide-react'

function formatSize(bytes) {
  return bytes < 1024 ** 2 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export default function DocumentLibrary({ documents }) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div><p className="section-kicker">Library</p><h2 className="mt-1 text-sm font-semibold text-white">Session documents</h2></div>
        <span className="count-badge">{documents.length} indexed</span>
      </div>
      {documents.length ? (
        <div className="mt-4 space-y-2">
          {documents.map(document => (
            <div className="document-card" key={document.name}>
              <span className="pdf-icon"><FileText size={15} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-zinc-200">{document.name}</p><p className="mt-0.5 text-[11px] text-zinc-600">{formatSize(document.size)}</p></div>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400"><CheckCircle2 size={12} /> Indexed</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/[0.07] px-4 py-4 text-xs text-zinc-600"><Library size={17} /> Uploaded documents appear here for this session.</div>
      )}
    </section>
  )
}
