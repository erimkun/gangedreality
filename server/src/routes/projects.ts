import { Router, Response } from 'express'
import multer from 'multer'
import unzipper from 'unzipper'
import { Readable } from 'stream'
import {
  listProjects,
  readProjectJson,
  writeProjectJson,
  createProjectDirectory,
  deleteProjectDirectory,
  saveAsset,
  updateProjectsManifest,
  isValidProjectId,
  isValidFilename,
  sanitizeFilename,
  isAllowedExtension,
  getProjectPath,
  hasTraversalSequence,
} from '../utils/fileManager.js'
import { authRequired, AuthRequest } from '../middleware/auth.js'
import fs from 'fs/promises'
import path from 'path'

const router = Router()

// Multer setup — memory storage, 200MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  preservePath: true,
  limits: { fileSize: 200 * 1024 * 1024 }
})

router.use((req, res, next) => {
  if (hasTraversalSequence(req.originalUrl)) {
    res.status(400).json({ error: 'Geçersiz istek yolu' })
    return
  }
  next()
})

// ─── GET /api/projects — List all projects with metadata ─────────────
router.get('/', async (_req, res: Response) => {
  try {
    const projectIds = await listProjects()
    const projects = await Promise.all(
      projectIds.map(async (id) => {
        const config = await readProjectJson(id, 'project.json') as Record<string, unknown> | null
        return {
          projectId: id,
          projectName: config?.projectName || id,
          status: config?.status || 'published',
          thumbnail: config?.thumbnail || null,
        }
      })
    )
    res.json(projects)
  } catch (err) {
    console.error('List projects error:', err)
    res.status(500).json({ error: 'Proje listesi alınamadı' })
  }
})

// ─── GET /api/projects/:id — Get all config files for a project ──────
router.get('/:id', async (req, res: Response) => {
  const { id } = req.params
  if (!isValidProjectId(id)) {
    res.status(400).json({ error: 'Geçersiz proje ID' })
    return
  }

  try {
    const [project, scene, interactions, variants, hotspots] = await Promise.all([
      readProjectJson(id, 'project.json'),
      readProjectJson(id, 'scene.json'),
      readProjectJson(id, 'interactions.json'),
      readProjectJson(id, 'variants.json'),
      readProjectJson(id, 'hotspots.json'),
    ])

    if (!project) {
      res.status(404).json({ error: 'Proje bulunamadı' })
      return
    }

    res.json({ project, scene, interactions, variants, hotspots })
  } catch (err) {
    console.error('Get project error:', err)
    res.status(500).json({ error: 'Proje verisi okunamadı' })
  }
})

// ─── POST /api/projects — Create a new project ──────────────────────
router.post('/', authRequired, async (req: AuthRequest, res: Response) => {
  const { projectId, projectName } = req.body

  if (!projectId || !isValidProjectId(projectId)) {
    res.status(400).json({ error: 'Geçersiz proje ID. Sadece harf, rakam, tire ve alt çizgi kullanılabilir.' })
    return
  }

  // Check if project already exists
  const existing = await readProjectJson(projectId, 'project.json')
  if (existing) {
    res.status(409).json({ error: 'Bu proje ID zaten mevcut' })
    return
  }

  try {
    await createProjectDirectory(projectId, projectName || projectId)
    await updateProjectsManifest()
    res.status(201).json({ message: 'Proje oluşturuldu', projectId })
  } catch (err) {
    console.error('Create project error:', err)
    res.status(500).json({ error: 'Proje oluşturulamadı' })
  }
})

// ─── PUT /api/projects/:id — Save all config files ──────────────────
router.put('/:id', authRequired, async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  if (!isValidProjectId(id)) {
    res.status(400).json({ error: 'Geçersiz proje ID' })
    return
  }

  const { project, scene, interactions, variants, hotspots } = req.body

  try {
    const writes: Promise<void>[] = []
    if (project) writes.push(writeProjectJson(id, 'project.json', project))
    if (scene) writes.push(writeProjectJson(id, 'scene.json', scene))
    if (interactions) writes.push(writeProjectJson(id, 'interactions.json', interactions))
    if (variants) writes.push(writeProjectJson(id, 'variants.json', variants))
    if (hotspots) writes.push(writeProjectJson(id, 'hotspots.json', hotspots))

    if (writes.length === 0) {
      res.status(400).json({ error: 'Kaydedilecek veri yok' })
      return
    }

    await Promise.all(writes)
    await updateProjectsManifest()
    res.json({ message: 'Proje kaydedildi' })
  } catch (err) {
    console.error('Save project error:', err)
    res.status(500).json({ error: 'Proje kaydedilemedi' })
  }
})

// ─── DELETE /api/projects/:id — Delete a project ─────────────────────
router.delete('/:id', authRequired, async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  if (!isValidProjectId(id)) {
    res.status(400).json({ error: 'Geçersiz proje ID' })
    return
  }

  try {
    await deleteProjectDirectory(id)
    await updateProjectsManifest()
    res.json({ message: 'Proje silindi' })
  } catch (err) {
    console.error('Delete project error:', err)
    res.status(500).json({ error: 'Proje silinemedi' })
  }
})

// ─── POST /api/projects/:id/assets — Upload a file (model/texture) ──
router.post(
  '/:id/assets',
  authRequired,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    if (!isValidProjectId(id)) {
      res.status(400).json({ error: 'Geçersiz proje ID' })
      return
    }

    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Dosya yüklenmedi' })
      return
    }

    if (!isValidFilename(file.originalname)) {
      res.status(400).json({ error: 'Geçersiz dosya adı' })
      return
    }

    const safeFilename = sanitizeFilename(file.originalname)

    if (!isAllowedExtension(safeFilename)) {
      res.status(400).json({ error: 'İzin verilmeyen dosya türü' })
      return
    }

    // Determine subfolder from query or file extension
    const ext = path.extname(safeFilename).toLowerCase()
    const subfolder = (req.query.folder as string) || (
      ['.glb', '.gltf'].includes(ext) ? 'model' : 'textures'
    )

    if (subfolder !== 'model' && subfolder !== 'textures') {
      res.status(400).json({ error: 'Geçersiz klasör. model veya textures olmalı.' })
      return
    }

    try {
      const relativePath = await saveAsset(id, subfolder, safeFilename, file.buffer)
      res.json({ message: 'Dosya yüklendi', path: relativePath })
    } catch (err) {
      console.error('Upload asset error:', err)
      res.status(500).json({ error: 'Dosya yüklenemedi' })
    }
  }
)

// ─── POST /api/projects/:id/thumbnail — Upload thumbnail ────────────
router.post(
  '/:id/thumbnail',
  authRequired,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    if (!isValidProjectId(id)) {
      res.status(400).json({ error: 'Geçersiz proje ID' })
      return
    }

    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Dosya yüklenmedi' })
      return
    }

    try {
      const relativePath = await saveAsset(id, 'textures', 'thumbnail.jpg', file.buffer)

      // Update project.json with thumbnail path
      const config = await readProjectJson(id, 'project.json') as Record<string, unknown> | null
      if (config) {
        config.thumbnail = relativePath
        await writeProjectJson(id, 'project.json', config)
      }

      res.json({ message: 'Thumbnail yüklendi', path: relativePath })
    } catch (err) {
      console.error('Upload thumbnail error:', err)
      res.status(500).json({ error: 'Thumbnail yüklenemedi' })
    }
  }
)

// ─── POST /api/projects/:id/publish — Upload ZIP to create/update ────
router.post(
  '/:id/publish',
  authRequired,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    if (!isValidProjectId(id)) {
      res.status(400).json({ error: 'Geçersiz proje ID' })
      return
    }

    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'ZIP dosyası yüklenmedi' })
      return
    }

    try {
      const projectDir = getProjectPath(id)
      await fs.mkdir(projectDir, { recursive: true })

      // Extract ZIP contents to project directory
      const stream = Readable.from(file.buffer)
      const writePromises: Promise<void>[] = []
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(unzipper.Parse())
          .on('entry', async (entry) => {
            const entryPath = entry.path as string
            const entryType = entry.type as string

            // Security: skip entries with path traversal
            if (entryPath.includes('..') || entryPath.startsWith('/')) {
              entry.autodrain()
              return
            }

            const fullPath = path.join(projectDir, entryPath)

            if (entryType === 'Directory') {
              await fs.mkdir(fullPath, { recursive: true })
              entry.autodrain()
            } else {
              // Collect all data then write — using a promise to track completion
              const writePromise = new Promise<void>((res, rej) => {
                const chunks: Buffer[] = []
                entry.on('data', (chunk: Buffer) => chunks.push(chunk))
                entry.on('end', async () => {
                  try {
                    await fs.mkdir(path.dirname(fullPath), { recursive: true })
                    await fs.writeFile(fullPath, Buffer.concat(chunks))
                    res()
                  } catch (e) { rej(e) }
                })
                entry.on('error', rej)
              })
              writePromises.push(writePromise)
            }
          })
          .on('close', resolve)
          .on('error', reject)
      })
      // Wait for all file writes to complete
      await Promise.all(writePromises)

      await updateProjectsManifest()
      res.json({ message: 'Proje ZIP ile güncellendi', projectId: id })
    } catch (err) {
      console.error('Publish ZIP error:', err)
      res.status(500).json({ error: 'ZIP dosyası işlenemedi' })
    }
  }
)

// ─── PATCH /api/projects/:id/settings — Update project settings ──────
router.patch('/:id/settings', authRequired, async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  if (!isValidProjectId(id)) {
    res.status(400).json({ error: 'Geçersiz proje ID' })
    return
  }

  const config = await readProjectJson(id, 'project.json') as Record<string, unknown> | null
  if (!config) {
    res.status(404).json({ error: 'Proje bulunamadı' })
    return
  }

  const { projectName, status } = req.body

  if (projectName !== undefined) config.projectName = projectName
  if (status !== undefined) {
    if (status !== 'draft' && status !== 'published') {
      res.status(400).json({ error: 'Geçersiz durum. draft veya published olmalı.' })
      return
    }
    config.status = status
  }

  try {
    await writeProjectJson(id, 'project.json', config)
    res.json({ message: 'Ayarlar güncellendi' })
  } catch (err) {
    console.error('Update settings error:', err)
    res.status(500).json({ error: 'Ayarlar güncellenemedi' })
  }
})

export default router
