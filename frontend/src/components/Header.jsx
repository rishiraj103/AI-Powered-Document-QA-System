import { Command, FileSearch2 } from 'lucide-react'

function SystemStatus({ status }) {
  const label = status === 'online' ? 'System online' : status === 'offline' ? 'Backend unavailable' : 'Checking system'
  return <div className={`status-pill status-${status}`} role="status"><span className="status-dot" />{label}</div>
}

export default function Header({ status, onFocusQuestion }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="brand-mark"><FileSearch2 size={20} /></div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-white">RAG Intelligence</div>
            <div className="hidden text-[11px] text-zinc-500 sm:block">Retrieval-Augmented Document Assistant</div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <SystemStatus status={status} />
          <button className="shortcut-button" onClick={onFocusQuestion} aria-label="Focus question input">
            <Command size={13} /><span>K</span>
          </button>
        </div>
      </div>
    </header>
  )
}
