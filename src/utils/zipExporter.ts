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
  zip.file('project.json', JSON.stringify(projectData.project, null, 2))
  zip.file('scene.json', JSON.stringify(projectData.scene, null, 2))
  zip.file('interactions.json', JSON.stringify(projectData.interactions, null, 2))
  zip.file('variants.json', JSON.stringify(projectData.variants, null, 2))

  // Add model file if available
  if (options.includeModel && window.__loadedModelFile) {
    const modelFile = window.__loadedModelFile
    log('Adding model file', { name: modelFile.name, size: modelFile.size })
    onProgress?.(30, 'Model dosyası ekleniyor...')
    const arrayBuffer = await modelFile.arrayBuffer()
    modelFolder.file(modelFile.name, arrayBuffer)
    
    // Update project.json with correct model path
    projectData.project.assets.mainModel = `model/${modelFile.name}`
    zip.file('project.json', JSON.stringify(projectData.project, null, 2))
  } else {
    log('No model file to include', { includeModel: options.includeModel, hasFile: !!window.__loadedModelFile })
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

/**
 * Imports a project from a ZIP file
 */
export async function importProjectFromZip(file: File): Promise<FullProjectData | null> {
  log('Starting ZIP import', { filename: file.name, size: file.size })
  
  try {
    const zip = await JSZip.loadAsync(file)
    log('ZIP loaded, reading contents')
    
    // Read project.json
    const projectFile = zip.file('data/project.json')
    if (!projectFile) {
      log('ERROR: project.json not found')
      throw new Error('project.json bulunamadı')
    }
    const projectJson = await projectFile.async('string')
    const project = JSON.parse(projectJson)
    log('project.json parsed', { projectId: project.projectId })

    // Read scene.json
    const sceneFile = zip.file('data/scene.json')
    const scene = sceneFile 
      ? JSON.parse(await sceneFile.async('string'))
      : null
    log('scene.json', sceneFile ? 'loaded' : 'not found')

    // Read interactions.json
    const interactionsFile = zip.file('data/interactions.json')
    const interactions = interactionsFile
      ? JSON.parse(await interactionsFile.async('string'))
      : { zones: [] }
    log('interactions.json', { zoneCount: interactions.zones?.length || 0 })

    // Read variants.json
    const variantsFile = zip.file('data/variants.json')
    const variants = variantsFile
      ? JSON.parse(await variantsFile.async('string'))
      : { configurableGroups: [] }
    log('variants.json', { groupCount: variants.configurableGroups?.length || 0 })

    // Extract model file and create blob URL
    const modelFiles = zip.folder('model')?.file(/.+/)
    if (modelFiles && modelFiles.length > 0) {
      const modelFile = modelFiles[0]
      log('Extracting model', { name: modelFile.name })
      const modelBlob = await modelFile.async('blob')
      const modelFileObj = new File([modelBlob], modelFile.name, { type: 'model/gltf-binary' })
      window.__loadedModelFile = modelFileObj
      
      // Create blob URL for immediate use
      const blobUrl = URL.createObjectURL(modelBlob)
      project.assets.mainModel = blobUrl
      log('Model blob URL created', { blobUrl })
    }

    // Extract texture files
    window.__loadedTextures = new Map()
    const textureFiles = zip.folder('textures')?.file(/.+/)
    if (textureFiles) {
      log('Extracting textures', { count: textureFiles.length })
      for (const textureFile of textureFiles) {
        const blob = await textureFile.async('blob')
        const fileObj = new File([blob], textureFile.name)
        window.__loadedTextures.set(textureFile.name, fileObj)
      }
    }

    log('Import complete!')
    return {
      project,
      scene,
      interactions,
      variants
    }
  } catch (error) {
    log('ERROR: Import failed', error)
    console.error('ZIP import error:', error)
    return null
  }
}
