import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { FullProjectData } from '@/types'

// Debug logger
const DEBUG = true
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
 */
export async function exportProjectAsZip(
  projectData: FullProjectData,
  options: ExportOptions = { includeModel: true, includeTextures: true }
): Promise<void> {
  const { onProgress } = options
  log('Starting export', { projectId: projectData.project.projectId, options })
  onProgress?.(0, 'Dışa aktarma başlıyor...')

  const zip = new JSZip()
  const projectId = projectData.project.projectId

  // Create folder structure
  // JSON files go to root, model and textures in subfolders
  log('Creating folder structure')
  const modelFolder = zip.folder('model')
  const texturesFolder = zip.folder('textures')

  if (!modelFolder || !texturesFolder) {
    log('ERROR: Failed to create folder structure')
    throw new Error('ZIP klasör yapısı oluşturulamadı')
  }

  // Add JSON config files to root (not in data/ subfolder)
  // This matches the expected structure: /data/{projectId}/project.json
  log('Adding JSON config files')
  onProgress?.(10, 'Konfigürasyon dosyaları ekleniyor...')

  // Process interactions to safe interactions images
  const interactionsClone = JSON.parse(JSON.stringify(projectData.interactions))
  const win = window as any

  if (win.__interactionFiles && interactionsClone.zones) {
    for (const zone of interactionsClone.zones) {
      if (zone.popup?.blocks) {
        for (const block of zone.popup.blocks) {
          if (block.type === 'image' && block.content && block.content.startsWith('blob:')) {
            if (win.__interactionFiles.has(block.content)) {
              const file = win.__interactionFiles.get(block.content)
              if (file) {
                const fileName = `int_${zone.id}_${block.id}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                const arrayBuffer = await file.arrayBuffer()
                texturesFolder?.file(fileName, arrayBuffer)
                block.content = `textures/${fileName}`
              }
            }
          }
        }
      }
    }
  }

  zip.file('interactions.json', JSON.stringify(interactionsClone, null, 2))
  zip.file('project.json', JSON.stringify(projectData.project, null, 2))
  // zip.file('scene.json', JSON.stringify(projectData.scene, null, 2)) // Already saved with custom handling below

  // Process variants to replace Blob URLs with relative paths
  const variantsClone = JSON.parse(JSON.stringify(projectData.variants))

  if (win.__blobUrlToFileName) {
    variantsClone.configurableGroups.forEach((group: any) => {
      group.options.forEach((option: any) => {
        if (option.textureUrl && win.__blobUrlToFileName?.has(option.textureUrl)) {
          option.textureUrl = win.__blobUrlToFileName.get(option.textureUrl)
        }
        if (option.normalMapUrl && win.__blobUrlToFileName?.has(option.normalMapUrl)) {
          option.normalMapUrl = win.__blobUrlToFileName.get(option.normalMapUrl)
        }
        if (option.roughnessMapUrl && win.__blobUrlToFileName?.has(option.roughnessMapUrl)) {
          option.roughnessMapUrl = win.__blobUrlToFileName.get(option.roughnessMapUrl)
        }
      })
    })
  }

  // Process Scene Environment HDRI (Custom)
  const sceneClone = JSON.parse(JSON.stringify(projectData.scene))
  if (sceneClone.environment && sceneClone.environment.customHdriUrl) {
    if (win.__blobUrlToFileName?.has(sceneClone.environment.customHdriUrl)) {
      sceneClone.environment.customHdriUrl = win.__blobUrlToFileName.get(sceneClone.environment.customHdriUrl)
    }
  }

  // Process Hotspots Icons
  const hotspotsClone = JSON.parse(JSON.stringify(projectData.hotspots))
  if (hotspotsClone.nodes) {
    hotspotsClone.nodes.forEach((node: any) => {
      if (node.customIconUrl && win.__blobUrlToFileName?.has(node.customIconUrl)) {
        node.customIconUrl = win.__blobUrlToFileName.get(node.customIconUrl)
      }
    })
  }
  if (hotspotsClone.settings && hotspotsClone.settings.defaultCustomIconUrl) {
    if (win.__blobUrlToFileName?.has(hotspotsClone.settings.defaultCustomIconUrl)) {
      hotspotsClone.settings.defaultCustomIconUrl = win.__blobUrlToFileName.get(hotspotsClone.settings.defaultCustomIconUrl)
    }
  }

  zip.file('variants.json', JSON.stringify(variantsClone, null, 2))
  zip.file('hotspots.json', JSON.stringify(hotspotsClone, null, 2))
  zip.file('scene.json', JSON.stringify(sceneClone, null, 2))

  // Add model file if available
  // Check both single file (legacy/import) and array (new upload)
  const modelFileToExport = window.__loadedModelFile || (window.__loadedModelFiles && window.__loadedModelFiles.length > 0 ? window.__loadedModelFiles[0] : null)

  if (options.includeModel && modelFileToExport) {
    const modelFile = modelFileToExport
    log('Adding model file', { name: modelFile.name, size: modelFile.size })
    onProgress?.(30, 'Model dosyası ekleniyor...')
    const arrayBuffer = await modelFile.arrayBuffer()
    modelFolder.file(modelFile.name, arrayBuffer)

    // Update project.json with correct model path
    projectData.project.assets.mainModel = `model/${modelFile.name}`

    // Also update any model in the models array that matches the blob URL
    if (projectData.project.assets.models) {
      projectData.project.assets.models.forEach(model => {
        // If the model URL is a blob URL, we assume it's the one we just exported
        // or check if we can map it
        if (model.url && model.url.startsWith('blob:')) {
          // For now, if we are exporting a single model file, we assume all blob models point to it
          // Or ideally we should have a map, but the current system seems to assume single main model export
          model.url = `model/${modelFile.name}`
        }
      })
    }

    zip.file('project.json', JSON.stringify(projectData.project, null, 2))
  } else {
    log('No model file to include', { includeModel: options.includeModel, hasFile: !!modelFileToExport })
  }

  // Add texture files if available
  if (options.includeTextures && window.__loadedTextures) {
    log('Adding texture files', { count: window.__loadedTextures.size })
    onProgress?.(50, 'Texture dosyaları ekleniyor...')
    for (const [filename, file] of window.__loadedTextures.entries()) {
      log('Adding texture', { filename })
      const arrayBuffer = await file.arrayBuffer()
      texturesFolder.file(filename, arrayBuffer)
    }
  }

  // Add a README file
  const readmeContent = `# ${projectData.project.projectName}

Bu proje Ganged Reality 3D CMS ile oluşturulmuştur.

## Dosya Yapısı

- \`project.json\` - Genel proje ayarları
- \`scene.json\` - Sahne ve ışık ayarları
- \`interactions.json\` - Etkileşim noktaları
- \`variants.json\` - Materyal varyasyonları
- \`hotspots.json\` - Navigasyon noktaları
- \`model/\` - 3D model dosyaları
- \`textures/\` - Texture ve HDRi dosyaları

## Kurulum

Bu ZIP'in içeriğini \`public/data/${projectId}/\` klasörüne çıkartın.
Sonra tarayıcıda \`/${projectId}\` adresine gidin.

Proje ID: ${projectId}
Versiyon: ${projectData.project.version}
`

  zip.file('README.md', readmeContent)

  // Generate and download ZIP
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


