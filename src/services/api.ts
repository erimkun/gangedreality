const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const TOKEN_KEY = 'gr-api-token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    throw new Error('AUTH_REQUIRED')
  }

  return res
}

// ─── Auth ────────────────────────────────────────────────────────────
export async function login(password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  if (!res.ok) return false

  const data = await res.json()
  if (data.token) {
    setToken(data.token)
    return true
  }
  return false
}

export function logout(): void {
  clearToken()
}

// ─── Projects ────────────────────────────────────────────────────────
export interface ProjectListItem {
  projectId: string
  projectName: string
  status: 'draft' | 'published'
  thumbnail: string | null
}

export async function fetchProjects(): Promise<ProjectListItem[]> {
  const res = await apiFetch('/projects')
  if (!res.ok) throw new Error('Proje listesi alınamadı')
  return res.json()
}

export async function fetchProject(id: string): Promise<Record<string, unknown>> {
  const res = await apiFetch(`/projects/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('Proje verisi alınamadı')
  return res.json()
}

export async function createProject(projectId: string, projectName: string): Promise<void> {
  const res = await apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify({ projectId, projectName }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Proje oluşturulamadı')
  }
}

export async function saveProject(
  projectId: string,
  data: { project?: unknown; scene?: unknown; interactions?: unknown; variants?: unknown; hotspots?: unknown },
): Promise<void> {
  const res = await apiFetch(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Proje kaydedilemedi')
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const res = await apiFetch(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Proje silinemedi')
}

// ─── Assets ──────────────────────────────────────────────────────────
export async function uploadAsset(
  projectId: string,
  file: File,
  folder?: 'model' | 'textures',
): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const query = folder ? `?folder=${folder}` : ''
  const res = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/assets${query}`,
    { method: 'POST', body: form },
  )

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Dosya yüklenemedi')
  }

  const data = await res.json()
  return data.path // relative path e.g. "model/file.glb"
}

export async function uploadThumbnail(
  projectId: string,
  file: File | Blob,
): Promise<string> {
  const form = new FormData()
  form.append('file', file, 'thumbnail.jpg')

  const res = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/thumbnail`,
    { method: 'POST', body: form },
  )

  if (!res.ok) throw new Error('Thumbnail yüklenemedi')
  const data = await res.json()
  return data.path
}

// ─── ZIP Publish ─────────────────────────────────────────────────────
export async function publishZip(projectId: string, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)

  const res = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/publish`,
    { method: 'POST', body: form },
  )

  if (!res.ok) throw new Error('ZIP yüklenemedi')
}

// ─── Settings ────────────────────────────────────────────────────────
export async function updateProjectSettings(
  projectId: string,
  settings: { projectName?: string; status?: 'draft' | 'published' },
): Promise<void> {
  const res = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/settings`,
    { method: 'PATCH', body: JSON.stringify(settings) },
  )
  if (!res.ok) throw new Error('Ayarlar güncellenemedi')
}
