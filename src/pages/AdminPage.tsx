import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchProjects,
  deleteProject,
  createProject,
  updateProjectSettings,
  publishZip,
  uploadThumbnail,
  isAuthenticated,
  login,
  logout,
  type ProjectListItem,
} from '@/services/api'
import { toast } from '@/store/useToastStore'

// ─── Auth Gate ───────────────────────────────────────────────────────
function AdminAuthGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const ok = await login(password)
      if (ok) onAuth()
      else setError('Hatalı şifre')
    } catch {
      setError('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f12] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="text-lg font-semibold">Admin Panel</h1>
        <p className="mt-2 text-sm text-white/70">Devam etmek için şifre girin.</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/50"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50">
              {loading ? 'Bağlanıyor...' : 'Giriş Yap'}
            </button>
            <Link to="/" className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm text-center text-white/80 hover:bg-white/5">
              Ana Sayfa
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── New Project Modal ───────────────────────────────────────────────
function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [projectId, setProjectId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId.trim()) return
    setLoading(true)
    setError(null)
    try {
      await createProject(projectId.trim(), projectName.trim() || projectId.trim())
      toast.success('Proje oluşturuldu!')
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1419] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Yeni Proje Oluştur</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-white/60">Proje ID (slug)</label>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="ornek-proje-1"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">Proje Adı</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Örnek Proje"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading || !projectId.trim()} className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50">
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ZIP Import Modal ────────────────────────────────────────────────
function ZipImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [projectId, setProjectId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.zip')) {
      setFile(f)
      if (!projectId) {
        setProjectId(f.name.replace('.zip', '').replace(/[^a-zA-Z0-9_-]/g, '-'))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !projectId.trim()) return
    setLoading(true)
    try {
      await publishZip(projectId.trim(), file)
      toast.success('ZIP import başarılı!')
      onImported()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'ZIP import başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1419] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">ZIP ile Proje Yükle</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-white/60">Proje ID</label>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="proje-kodu"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
              dragOver ? 'border-cyan-400 bg-cyan-400/5' : 'border-white/10 hover:border-white/20'
            }`}
          >
            {file ? (
              <p className="text-sm text-white/80">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
            ) : (
              <>
                <p className="text-sm text-white/60">ZIP dosyasını sürükleyin</p>
                <p className="mt-1 text-xs text-white/40">veya</p>
                <label className="mt-2 cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15">
                  Dosya Seç
                  <input type="file" accept=".zip" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
                </label>
              </>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading || !file || !projectId.trim()} className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50">
              {loading ? 'Yükleniyor...' : 'Yükle'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ────────────────────────────────────────────
function DeleteConfirmModal({ projectId, onClose, onDeleted }: { projectId: string; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false)
  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteProject(projectId)
      toast.success('Proje silindi')
      onDeleted()
      onClose()
    } catch {
      toast.error('Proje silinemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1419] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-red-400">Projeyi Sil</h2>
        <p className="mt-2 text-sm text-white/70">
          <strong className="text-white">{projectId}</strong> projesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="mt-4 flex gap-2">
          <button onClick={handleDelete} disabled={loading} className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50">
            {loading ? 'Siliniyor...' : 'Evet, Sil'}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Project Card ────────────────────────────────────────────────────
function ProjectCard({
  project,
  onRefresh,
  onDelete,
}: {
  project: ProjectListItem
  onRefresh: () => void
  onDelete: (id: string) => void
}) {
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(project.projectName)
  const [uploadingThumb, setUploadingThumb] = useState(false)

  const handleNameSave = async () => {
    if (newName.trim() && newName !== project.projectName) {
      try {
        await updateProjectSettings(project.projectId, { projectName: newName.trim() })
        toast.success('Proje adı güncellendi')
        onRefresh()
      } catch {
        toast.error('Ad güncellenemedi')
      }
    }
    setEditingName(false)
  }

  const handleStatusToggle = async () => {
    const newStatus = project.status === 'published' ? 'draft' : 'published'
    try {
      await updateProjectSettings(project.projectId, { status: newStatus })
      toast.success(newStatus === 'published' ? 'Proje yayınlandı' : 'Proje taslağa alındı')
      onRefresh()
    } catch {
      toast.error('Durum güncellenemedi')
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      await uploadThumbnail(project.projectId, file)
      toast.success('Thumbnail güncellendi')
      onRefresh()
    } catch {
      toast.error('Thumbnail yüklenemedi')
    } finally {
      setUploadingThumb(false)
    }
  }

  const thumbnailUrl = project.thumbnail
    ? `/data/${project.projectId}/${project.thumbnail}`
    : null

  return (
    <div className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition-all">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={project.projectName} className="w-full h-full object-cover" />
        ) : (
          <div className="text-4xl opacity-20">🏠</div>
        )}
        {/* Status badge */}
        <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          project.status === 'published'
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
        }`}>
          {project.status === 'published' ? 'Yayında' : 'Taslak'}
        </span>
        {/* Thumbnail upload on hover */}
        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <span className="text-xs text-white/80 bg-black/50 rounded-lg px-2 py-1">
            {uploadingThumb ? 'Yükleniyor...' : 'Thumbnail Değiştir'}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingThumb} />
        </label>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <div>
          {editingName ? (
            <div className="flex gap-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false) }}
                autoFocus
                className="flex-1 rounded border border-white/20 bg-black/30 px-2 py-1 text-sm text-white outline-none"
              />
              <button onClick={handleNameSave} className="text-cyan-400 text-xs hover:text-cyan-300">✓</button>
            </div>
          ) : (
            <h3
              className="text-sm font-medium text-white cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => setEditingName(true)}
              title="Tıklayarak adı düzenle"
            >
              {project.projectName}
            </h3>
          )}
          <p className="text-[11px] text-white/40 mt-0.5">{project.projectId}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5">
          <Link
            to={`/${project.projectId}/editor`}
            className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 text-[11px] text-cyan-300 hover:bg-cyan-500/30 transition-colors"
          >
            Editör
          </Link>
          <Link
            to={`/${project.projectId}`}
            className="rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] text-white/70 hover:bg-white/15 transition-colors"
          >
            Viewer
          </Link>
          <button
            onClick={handleStatusToggle}
            className="rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] text-white/70 hover:bg-white/15 transition-colors"
          >
            {project.status === 'published' ? 'Taslağa Al' : 'Yayınla'}
          </button>
          <button
            onClick={() => onDelete(project.projectId)}
            className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-500/20 transition-colors"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showZipImport, setShowZipImport] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchProjects()
      setProjects(list)
    } catch (err) {
      console.error('Failed to load projects:', err)
      toast.error('Proje listesi yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) loadProjects()
  }, [authed, loadProjects])

  if (!authed) {
    return <AdminAuthGate onAuth={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-[#0b0f12] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f12]/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/60 hover:text-white text-sm transition-colors">← Ana Sayfa</Link>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <span className="text-xs text-white/40 bg-white/5 rounded-full px-2 py-0.5">{projects.length} proje</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowZipImport(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 transition-colors"
            >
              <span>📦</span> ZIP Import
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-cyan-400 transition-colors"
            >
              <span>+</span> Yeni Proje
            </button>
            <button
              onClick={() => { logout(); setAuthed(false) }}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/40 text-sm">Yükleniyor...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4 opacity-30">📂</div>
            <h2 className="text-lg text-white/60">Henüz proje yok</h2>
            <p className="text-sm text-white/40 mt-1">Yeni proje oluşturun veya ZIP ile import edin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.projectId}
                project={p}
                onRefresh={loadProjects}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreated={loadProjects} />
      )}
      {showZipImport && (
        <ZipImportModal onClose={() => setShowZipImport(false)} onImported={loadProjects} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          projectId={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={loadProjects}
        />
      )}
    </div>
  )
}
