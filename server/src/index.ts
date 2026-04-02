import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import projectsRouter from './routes/projects.js'
import { getProjectsBasePath } from './utils/fileManager.js'
import fs from 'fs/promises'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '50mb' }))

// ─── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)

// ─── Health check ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', projectsPath: getProjectsBasePath() })
})

// ─── Error handler (multer errors etc.) ─────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[GR-API] Unhandled error:', err.message || err)
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Dosya boyutu çok büyük (max 200MB)' })
    return
  }
  res.status(500).json({ error: err.message || 'Sunucu hatası' })
})

// ─── Start ──────────────────────────────────────────────────────────
async function start() {
  // Ensure projects directory exists
  const basePath = getProjectsBasePath()
  await fs.mkdir(basePath, { recursive: true })

  app.listen(PORT, () => {
    console.log(`[GR-API] Server running on port ${PORT}`)
    console.log(`[GR-API] Projects path: ${basePath}`)
    console.log(`[GR-API] Auth: ${process.env.API_EDITOR_PASSWORD ? 'Password required' : 'No password set (open access)'}`)
  })
}

start().catch((err) => {
  console.error('Server failed to start:', err)
  process.exit(1)
})
