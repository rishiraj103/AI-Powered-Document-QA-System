import { useEffect, useRef, useState } from 'react'
import { ArrowDown, BookOpen, Database, RotateCcw, Sparkles } from 'lucide-react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import DocumentLibrary from './components/DocumentLibrary'
import QuestionInput from './components/QuestionInput'
import QueryHistory from './components/QueryHistory'
import AnswerCard from './components/AnswerCard'
import AnswerEmptyState from './components/AnswerEmptyState'
import SourceList from './components/SourceList'
import Notice from './components/Notice'
import { askQuestion, checkHealth, uploadDocuments } from './services/api'

const HISTORY_KEY = 'rag-intelligence-history'

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch {
    return []
  }
}

export default function App() {
  const [systemStatus, setSystemStatus] = useState('checking')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [indexedDocuments, setIndexedDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadNotice, setUploadNotice] = useState(null)
  const [question, setQuestion] = useState('')
  const [querying, setQuerying] = useState(false)
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [queryError, setQueryError] = useState('')
  const [history, setHistory] = useState(readHistory)
  const questionRef = useRef(null)

  useEffect(() => {
    let active = true
    checkHealth()
      .then(() => active && setSystemStatus('online'))
      .catch(() => active && setSystemStatus('offline'))
    return () => { active = false }
  }, [])

  useEffect(() => {
    function focusQuestion(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        questionRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusQuestion)
    return () => window.removeEventListener('keydown', focusQuestion)
  }, [])

  function addFiles(incomingFiles) {
    const pdfs = Array.from(incomingFiles).filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    const rejectedCount = incomingFiles.length - pdfs.length
    setSelectedFiles(current => {
      const existing = new Set(current.map(file => `${file.name}-${file.size}-${file.lastModified}`))
      return [...current, ...pdfs.filter(file => !existing.has(`${file.name}-${file.size}-${file.lastModified}`))]
    })
    setUploadNotice(rejectedCount ? { type: 'error', title: 'PDF files only', message: `${rejectedCount} unsupported file${rejectedCount === 1 ? ' was' : 's were'} skipped.` } : null)
  }

  async function handleUpload() {
    if (!selectedFiles.length || uploading) return
    setUploading(true)
    setUploadNotice(null)
    const pendingFiles = [...selectedFiles]
    try {
      const data = await uploadDocuments(pendingFiles)
      const uploadedNames = new Set(data.files)
      const indexed = pendingFiles
        .filter(file => uploadedNames.has(file.name))
        .map(file => ({ name: file.name, size: file.size, indexedAt: Date.now() }))
      setIndexedDocuments(indexed)
      setSelectedFiles([])
      setUploadNotice({
        type: 'success',
        title: 'Documents indexed successfully',
        message: `${data.files.length} document${data.files.length === 1 ? ' is' : 's are'} now ready for questions.`,
      })
      setSystemStatus('online')
      window.setTimeout(() => questionRef.current?.focus(), 100)
    } catch (error) {
      setUploadNotice({ type: 'error', title: 'Unable to index documents', message: error.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleQuery() {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || querying) return
    setQuerying(true)
    setAnswer('')
    setSources([])
    setQueryError('')
    try {
      const data = await askQuestion(cleanQuestion)
      setAnswer(data.answer)
      setSources(data.sources || [])
      const nextHistory = [cleanQuestion, ...history.filter(item => item !== cleanQuestion)].slice(0, 12)
      setHistory(nextHistory)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
      setSystemStatus('online')
    } catch (error) {
      setQueryError(error.message)
    } finally {
      setQuerying(false)
    }
  }

  function clearResult() {
    setQuestion('')
    setAnswer('')
    setSources([])
    setQueryError('')
    questionRef.current?.focus()
  }

  const hasResult = Boolean(answer || queryError || querying)

  return (
    <div className="min-h-screen bg-ink text-zinc-100">
      <Header status={systemStatus} onFocusQuestion={() => questionRef.current?.focus()} />

      <main className="relative mx-auto w-full max-w-[1400px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="ambient-glow" aria-hidden="true" />

        <section className="hero-panel relative overflow-hidden rounded-[28px] px-6 py-9 sm:px-10 sm:py-11">
          <div className="relative z-10 max-w-3xl">
            <div className="eyebrow"><Sparkles size={13} /> Document intelligence workspace</div>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Your documents. One intelligent interface.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              Turn PDFs into grounded answers with semantic retrieval, transparent context, and Gemini.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              {['PDF documents', 'Semantic retrieval', 'Relevant context', 'Grounded answer'].map((label, index) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="flow-step">{index + 1}</span><span>{label}</span>
                  {index < 3 && <ArrowDown className="mx-1 hidden -rotate-90 text-zinc-700 sm:block" size={13} />}
                </div>
              ))}
            </div>
          </div>
          <div className="hero-orbit" aria-hidden="true"><Database size={30} /><BookOpen size={22} /></div>
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.45fr)]">
          <div className="min-w-0">
            <UploadZone
              files={selectedFiles}
              uploading={uploading}
              onFiles={addFiles}
              onRemove={index => setSelectedFiles(files => files.filter((_, fileIndex) => fileIndex !== index))}
              onUpload={handleUpload}
            />
          </div>

          <div className="min-w-0">
            <QuestionInput
              ref={questionRef}
              value={question}
              querying={querying}
              onChange={setQuestion}
              onSubmit={handleQuery}
              onClear={() => setQuestion('')}
            />
          </div>
        </div>

        {uploadNotice && (
          <div className="mt-6">
            <Notice {...uploadNotice} onRetry={uploadNotice.type === 'error' && selectedFiles.length ? handleUpload : undefined} />
          </div>
        )}

        <div className={`mt-6 grid gap-6 ${history.length ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          <DocumentLibrary documents={indexedDocuments} />
          <QueryHistory history={history} onSelect={value => { setQuestion(value); questionRef.current?.focus() }} />
        </div>

        <section className={`mt-8 space-y-6 ${hasResult ? 'result-enter' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Analysis</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Grounded response</h2>
              </div>
              {(answer || queryError) && (
                <button className="secondary-button" onClick={clearResult}><RotateCcw size={14} /> Clear</button>
              )}
            </div>
            {hasResult ? (
              <AnswerCard answer={answer} sourceCount={sources.length} loading={querying} error={queryError} onRetry={handleQuery} />
            ) : (
              <AnswerEmptyState />
            )}
            {!querying && sources.length > 0 && <SourceList sources={sources} />}
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-6 text-center text-xs text-zinc-600">
        RAG Intelligence · Retrieval-augmented document assistant
      </footer>
    </div>
  )
}
