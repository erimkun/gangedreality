import fs from 'fs/promises'
import path from 'path'

const PROJECTS_STORAGE_PATH = process.env.PROJECTS_STORAGE_PATH || path.resolve('projects')

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Returns the absolute base path for all projects
 */
export function getProjectsBasePath(): string {
  return PROJECTS_STORAGE_PATH
}

/**
 * Validates a project ID — prevents path traversal
 */
export function isValidProjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  if (id.includes('..') || id.includes('/') || id.includes('\\')) return false
  if (id.includes('\0')) return false
  // Only allow alphanumeric, hyphens, underscores
  return /^[a-zA-Z0-9_-]+$/.test(id)
}

/**
 * Validates an asset filename — prevents path traversal
 */
export function isValidFilename(name: string): boolean {
  if (!name || typeof name !== 'string') return false
  const decoded = safeDecodeURIComponent(name).replace(/\\/g, '/')
  if (decoded.includes('..') || decoded.includes('/')) return false
  if (name.includes('\0')) return false
  return /^[a-zA-Z0-9_.-]+$/.test(decoded)
}

export function sanitizeFilename(name: string): string {
  return path.posix.basename(safeDecodeURIComponent(name).replace(/\\/g, '/'))
}

export function hasTraversalSequence(value: string): boolean {
  const normalized = safeDecodeURIComponent(value).replace(/\\/g, '/')
  return /(^|\/)\.\.(\/|$)/.test(normalized)
}

const ALLOWED_EXTENSIONS = new Set([
  '.glb', '.gltf', '.hdr', '.exr',
  '.png', '.jpg', '.jpeg', '.webp',
  '.mp3', '.wav', '.ogg'
])

/**
 * Checks if a file extension is allowed for upload
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXTENSIONS.has(ext)
}

/**
 * Get the absolute path for a project directory
 */
export function getProjectPath(projectId: string): string {
  return path.join(PROJECTS_STORAGE_PATH, projectId)
}

/**
 * List all project IDs from the storage directory
 */
export async function listProjects(): Promise<string[]> {
  try {
    await fs.mkdir(PROJECTS_STORAGE_PATH, { recursive: true })
    const entries = await fs.readdir(PROJECTS_STORAGE_PATH, { withFileTypes: true })
    const projectIds: string[] = []
    for (const entry of entries) {
      if (entry.isDirectory() && isValidProjectId(entry.name)) {
        // Check if it has a project.json
        try {
          await fs.access(path.join(PROJECTS_STORAGE_PATH, entry.name, 'project.json'))
          projectIds.push(entry.name)
        } catch {
          // Skip directories without project.json
        }
      }
    }
    return projectIds
  } catch {
    return []
  }
}

/**
 * Read a JSON file from a project directory
 */
export async function readProjectJson(projectId: string, filename: string): Promise<unknown | null> {
  try {
    const filePath = path.join(PROJECTS_STORAGE_PATH, projectId, filename)
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

/**
 * Write a JSON file to a project directory
 */
export async function writeProjectJson(projectId: string, filename: string, data: unknown): Promise<void> {
  const projectDir = path.join(PROJECTS_STORAGE_PATH, projectId)
  await fs.mkdir(projectDir, { recursive: true })
  const filePath = path.join(projectDir, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Create a new project with default config files
 */
export async function createProjectDirectory(projectId: string, projectName: string): Promise<void> {
  const projectDir = path.join(PROJECTS_STORAGE_PATH, projectId)
  await fs.mkdir(projectDir, { recursive: true })
  await fs.mkdir(path.join(projectDir, 'model'), { recursive: true })
  await fs.mkdir(path.join(projectDir, 'textures'), { recursive: true })

  const defaultProject = {
    projectId,
    projectName: projectName || projectId,
    version: '1.0',
    defaultMode: 'viewer',
    editorLock: false,
    status: 'draft',
    assets: { mainModel: null, envMap: null, models: [] }
  }

  const defaultScene = {
    environment: {
      hdri: null,
      hdriPreset: 'apartment',
      customHdriUrl: null,
      intensity: 0.7,
      rotation: 0,
      backgroundBlurriness: 0,
      showBackground: true
    },
    lights: [],
    player: {
      startPosition: [0, 1.7, 5],
      startRotation: [0, 0, 0],
      moveSpeed: 2,
      eyeHeight: 1.7
    },
    effects: {}
  }

  const defaultInteractions = { zones: [] }
  const defaultVariants = { configurableGroups: [] }
  const defaultHotspots = {
    nodes: [],
    settings: {
      cursorColor: '#ffffff',
      cursorSize: 0.4,
      cursorOpacity: 0.8,
      defaultShape: 'circle',
      animationDuration: 0.3,
      nodeColor: '#00d4ff',
      nodeHoverColor: '#ffffff',
      walkableMeshIds: []
    }
  }

  await Promise.all([
    writeProjectJson(projectId, 'project.json', defaultProject),
    writeProjectJson(projectId, 'scene.json', defaultScene),
    writeProjectJson(projectId, 'interactions.json', defaultInteractions),
    writeProjectJson(projectId, 'variants.json', defaultVariants),
    writeProjectJson(projectId, 'hotspots.json', defaultHotspots),
  ])
}

/**
 * Delete a project directory recursively
 */
export async function deleteProjectDirectory(projectId: string): Promise<void> {
  const projectDir = path.join(PROJECTS_STORAGE_PATH, projectId)
  await fs.rm(projectDir, { recursive: true, force: true })
}

/**
 * Save an uploaded file to the project's asset directory
 */
export async function saveAsset(
  projectId: string,
  subfolder: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const assetDir = path.join(PROJECTS_STORAGE_PATH, projectId, subfolder)
  await fs.mkdir(assetDir, { recursive: true })
  const filePath = path.join(assetDir, filename)
  await fs.writeFile(filePath, buffer)
  return `${subfolder}/${filename}`
}

/**
 * Update the projects.json manifest (auto-generated from directory listing)
 */
export async function updateProjectsManifest(): Promise<string[]> {
  const projectIds = await listProjects()
  const manifestPath = path.join(PROJECTS_STORAGE_PATH, 'projects.json')
  await fs.writeFile(manifestPath, JSON.stringify(projectIds, null, 2), 'utf-8')
  return projectIds
}
