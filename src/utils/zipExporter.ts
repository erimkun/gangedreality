import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { FullProjectData } from '@/types'

// Debug logger
const DEBUG = false
const log = (message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ZipExporter]`, message, data !== undefined ? data : '')
  }
}

interface ExportOptions {
  includeModel: boolean
  includeTextures: boolean
  onProgress?: (percent: number, message: string) => void
}

/**
 * Exports the current project as a ZIP file
 * Creates the folder structure defined in Project.md
 *
 * IMPORTANT: Only the deep-cloned `exportData` is modified — `projectData` (live store state) is never mutated.
 */
export async function exportProjectAsZip(
  projectData: FullProjectData,
  options: ExportOptions = { includeModel: true, includeTextures: true }
): Promise<void> {
  const { onProgress } = options
  log('Starting export', { projectId: projectData.project.projectId, options })
  onProgress?.(0, 'Dışa aktarma başlıyor...')

  // Deep clone so we never mutate live store state
  const exportData = JSON.parse(JSON.stringify(projectData)) as FullProjectData
  const projectId = exportData.project.projectId

  // Create ZIP instance
  const zip = new JSZip()

  // Create folder structure
  // JSON files go to root, model and textures in subfolders
  log('Creating folder structure')
  const modelFolder = zip.folder('model')
  const texturesFolder = zip.folder('textures')

  if (!modelFolder || !texturesFolder) {
    log('ERROR: Failed to create folder structure')
    throw new Error('ZIP klasör yapısı oluşturulamadı')
  }

  log('Adding JSON config files')
  onProgress?.(10, 'Konfigürasyon dosyaları ekleniyor...')

  const win = window as any

  // Helper: resolve blob/data URLs to relative file names
  const resolveAssetUrl = (url?: string) => {
    if (!url) return url
    if (win.__blobUrlToFileName?.has(url)) return win.__blobUrlToFileName.get(url)
    if (win.__dataUrlToFileName?.has(url)) return win.__dataUrlToFileName.get(url)
    return url
  }

  // --- Process interactions (embed blob images into textures/) ---
  const interactionsClone = exportData.interactions
  if (win.__interactionFiles && interactionsClone.zones) {
    for (const zone of interactionsClone.zones) {
      if (zone.popup?.blocks) {
        for (const block of zone.popup.blocks) {
          if (block.type === 'image' && block.content && block.content.startsWith('blob:')) {
            if (win.__interactionFiles.has(block.content)) {
              const file = win.__interactionFiles.get(block.content)
              if (file) {
                try {
                  const fileName = `int_${zone.id}_${block.id}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                  const arrayBuffer = await file.arrayBuffer()
                  texturesFolder.file(fileName, arrayBuffer)
                  block.content = `textures/${fileName}`
                } catch (err) {
                  log('ERROR: Failed to read interaction image file', err)
                }
              }
            }
          }
        }
      }
    }
  }

  // --- Process variants: replace Blob URLs with relative paths ---
  const variantsClone = exportData.variants
  variantsClone.configurableGroups.forEach((group: any) => {
    group.options.forEach((option: any) => {
      option.textureUrl = resolveAssetUrl(option.textureUrl)
      option.normalMapUrl = resolveAssetUrl(option.normalMapUrl)
      option.roughnessMapUrl = resolveAssetUrl(option.roughnessMapUrl)
    })
  })

  // --- Process Scene Environment HDRI ---
  const sceneClone = exportData.scene
  if (sceneClone.environment && sceneClone.environment.customHdriUrl) {
    sceneClone.environment.customHdriUrl = resolveAssetUrl(sceneClone.environment.customHdriUrl)
  }

  // --- Process Hotspots Icons ---
  const hotspotsClone = exportData.hotspots
  if (hotspotsClone.nodes) {
    hotspotsClone.nodes.forEach((node: any) => {
      node.customIconUrl = resolveAssetUrl(node.customIconUrl)
    })
  }
  if (hotspotsClone.settings && hotspotsClone.settings.defaultCustomIconUrl) {
    hotspotsClone.settings.defaultCustomIconUrl = resolveAssetUrl(hotspotsClone.settings.defaultCustomIconUrl)
  }

  // --- Add model file if available ---
  const modelFileToExport = win.__loadedModelFile || (win.__loadedModelFiles && win.__loadedModelFiles.length > 0 ? win.__loadedModelFiles[0] : null)

  if (options.includeModel && modelFileToExport) {
    const modelFile = modelFileToExport
    log('Adding model file', { name: modelFile.name, size: modelFile.size })
    onProgress?.(30, 'Model dosyası ekleniyor...')
    try {
      const arrayBuffer = await modelFile.arrayBuffer()
      modelFolder.file(modelFile.name, arrayBuffer)
    } catch (err) {
      log('ERROR: Failed to read model file', err)
      throw new Error(`Model dosyası okunamadı: ${modelFile.name}`)
    }

    // Update paths on the clone only
    exportData.project.assets.mainModel = `model/${modelFile.name}`

    if (exportData.project.assets.models) {
      exportData.project.assets.models.forEach(model => {
        if (model.url && model.url.startsWith('blob:')) {
          model.url = `model/${modelFile.name}`
        }
      })
    }
  } else {
    log('No model file to include', { includeModel: options.includeModel, hasFile: !!modelFileToExport })
  }

  // --- Add texture files ---
  if (options.includeTextures && win.__loadedTextures) {
    log('Adding texture files', { count: win.__loadedTextures.size })
    onProgress?.(50, 'Texture dosyaları ekleniyor...')
    for (const [filename, file] of win.__loadedTextures.entries()) {
      log('Adding texture', { filename })
      try {
        const arrayBuffer = await file.arrayBuffer()
        texturesFolder.file(filename, arrayBuffer)
      } catch (err) {
        log('ERROR: Failed to read texture file', { filename, err })
      }
    }
  }

  // --- Write all JSON config files (single write, after all processing) ---
  zip.file('project.json', JSON.stringify(exportData.project, null, 2))
  zip.file('interactions.json', JSON.stringify(interactionsClone, null, 2))
  zip.file('variants.json', JSON.stringify(variantsClone, null, 2))
  zip.file('hotspots.json', JSON.stringify(hotspotsClone, null, 2))
  zip.file('scene.json', JSON.stringify(sceneClone, null, 2))

  // --- Add README ---
  const readmeContent = `# ${exportData.project.projectName}

Bu proje Ganged Reality 3D CMS ile oluşturulmuştur.

- \`model/\` - 3D model dosyaları
- \`textures/\` - Texture ve HDRi dosyaları

## Kurulum

Bu ZIP'in içeriğini \`public/data/${projectId}/\` klasörüne çıkartın.
Proje ID: ${projectId}
Versiyon: ${exportData.project.version}
`

  zip.file('README.md', readmeContent)

  // --- Generate and download ZIP ---
  log('Generating ZIP file')
  onProgress?.(70, 'ZIP dosyası oluşturuluyor...')
  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  log('Download starting', { size: content.size })
  onProgress?.(90, 'İndirme başlatılıyor...')
  saveAs(content, `${projectId}.zip`)
  onProgress?.(100, 'Tamamlandı!')
  log('Export complete!')
}


