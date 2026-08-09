import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react'

export default function Notice({ type, title, message, onRetry }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertTriangle
  return (
    <div className={`notice notice-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} />
      <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-xs leading-5 opacity-75">{message}</p></div>
      {onRetry && <button className="copy-button" onClick={onRetry}><RotateCcw size={12} /> Retry</button>}
    </div>
  )
}
