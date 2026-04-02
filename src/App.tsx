import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import HomePage from './pages/HomePage'
import ViewerPage from './pages/ViewerPage'
import EditorPage from './pages/EditorPage'
import AdminPage from './pages/AdminPage'
import ToastContainer from './components/ui/ToastContainer'

const EDITOR_AUTH_STORAGE_KEY = 'gr-editor-auth'

function EditorGate() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)

  const editorPassword = import.meta.env.VITE_EDITOR_PASSWORD as string | undefined
  const isPasswordRequired = Boolean(editorPassword && editorPassword.trim())

  const isAuthorized = useMemo(() => {
    if (!isPasswordRequired) return true
    if (authorized) return true
    return localStorage.getItem(EDITOR_AUTH_STORAGE_KEY) === editorPassword
  }, [editorPassword, isPasswordRequired, authorized])

  if (isAuthorized) {
    return <EditorPage />
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editorPassword || password !== editorPassword) {
      setError('Hatali sifre')
      return
    }
    localStorage.setItem(EDITOR_AUTH_STORAGE_KEY, editorPassword)
    setError(null)
    setPassword('')
    setAuthorized(true)
  }

  const handleCancel = () => {
    if (projectId) {
      navigate(`/${projectId}`)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0b0f12] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="text-lg font-semibold">Editor Kilitli</h1>
        <p className="mt-2 text-sm text-white/70">Devam etmek icin sifre gir.</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sifre"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          {error && <div className="text-xs text-red-300">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium"
            >
              Giris Yap
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm"
            >
              Iptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <Routes>
        {/* Ana sayfa */}
        <Route path="/" element={<HomePage />} />
        
        {/* Admin Panel */}
        <Route path="/admin" element={<AdminPage />} />
        
        {/* Proje Viewer modu - /:projectId */}
        <Route path="/:projectId" element={<ViewerPage />} />
        
        {/* Proje Editor modu - /:projectId/editor */}
        <Route path="/:projectId/editor" element={<EditorGate />} />
      </Routes>
      
      {/* Global Toast Notifications */}
      <ToastContainer />
    </>
  )
}

export default App
