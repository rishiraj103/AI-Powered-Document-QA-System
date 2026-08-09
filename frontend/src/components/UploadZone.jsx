import { useRef, useState } from 'react'
import { FileText, LoaderCircle, Trash2, UploadCloud } from 'lucide-react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export default function UploadZone({ files, uploading, onFiles, onRemove, onUpload }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    onFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><p className="section-kicker">Documents</p><h2 className="mt-1 text-base font-semibold text-white">Build your knowledge base</h2></div>
        <span className="count-badge">{files.length} selected</span>
      </div>

      <button
        type="button"
        className={`upload-zone mt-5 ${dragging ? 'is-dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={event => { event.preventDefault(); setDragging(true) }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
        onDrop={handleDrop}
      >
        <span className="upload-icon"><UploadCloud size={21} /></span>
        <span className="mt-3 text-sm font-medium text-zinc-200">Drop PDF files here</span>
        <span className="mt-1 text-xs text-zinc-500">or click to browse · multiple files supported</span>
      </button>
      <input id="pdf-input" ref={inputRef} type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={event => { onFiles(Array.from(event.target.files)); event.target.value = '' }} />

      {files.length > 0 && (
        <div className="mt-4 space-y-2" aria-label="Selected PDF files">
          {files.map((file, index) => (
            <div className="file-row" key={`${file.name}-${file.size}-${file.lastModified}`}>
              <span className="pdf-icon"><FileText size={15} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-zinc-200">{file.name}</p><p className="mt-0.5 text-[11px] text-zinc-600">{formatSize(file.size)}</p></div>
              <button className="icon-button h-8 w-8" onClick={() => onRemove(index)} disabled={uploading} aria-label={`Remove ${file.name}`}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <button className="primary-button mt-4 w-full" onClick={onUpload} disabled={!files.length || uploading}>
        {uploading ? <><LoaderCircle className="animate-spin" size={16} /> Extracting, chunking & indexing…</> : <><UploadCloud size={16} /> Upload & index</>}
      </button>
      {!uploading && <p className="mt-3 text-center text-[11px] leading-5 text-zinc-600">Each upload replaces the active document set. Select related PDFs together.</p>}
      {uploading && <p className="mt-3 text-center text-[11px] leading-5 text-zinc-500">Processing time depends on document size and embedding availability.</p>}
    </section>
  )
}
