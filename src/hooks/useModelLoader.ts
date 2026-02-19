import { useCallback, useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'

// Debug logger
const DEBUG = false
const log = (message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ModelLoader]`, message, data !== undefined ? data : '')
  }
}

interface UseModelLoaderReturn {
  isLoading: boolean
  error: string | null
  loadModelFromFile: (file: File) => Promise<string | null>
  loadModelFromUrl: (url: string) => Promise<boolean>
}

export function useModelLoader(): UseModelLoaderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addModel, setMainModel, assets } = useProjectStore()

  const loadModelFromFile = useCallback(async (file: File): Promise<string | null> => {
    log('Loading model from file', { name: file.name, size: file.size, type: file.type })
    setIsLoading(true)
    setError(null)

    try {
      // Validate file type
      const validExtensions = ['.glb', '.gltf']
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      
      if (!validExtensions.includes(extension)) {
        log('ERROR: Invalid file extension', extension)
        throw new Error('Sadece GLB ve GLTF dosyaları destekleniyor')
      }

      // Create blob URL for the model
      const blobUrl = URL.createObjectURL(file)
      log('Blob URL created', { blobUrl })
      
      // Store in project
      log('Adding model to project store')
      addModel(blobUrl, file.name)
      
      // If this is the first model, also set it as mainModel for backward compatibility
      // We check if models array is empty or mainModel is null
      const currentModels = assets.models || []
      if (!assets.mainModel && currentModels.length === 0) {
        setMainModel(blobUrl)
      }
      
      // Also store the file reference for later export
      if (!window.__loadedModelFiles) {
        window.__loadedModelFiles = []
      }
      window.__loadedModelFiles.push(file)
      log('File reference stored for export')
      
      setIsLoading(false)
      log('Model loaded successfully!')
      return blobUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Model yüklenirken hata oluştu'
      log('ERROR:', message)
      setError(message)
      setIsLoading(false)
      return null
    }
  }, [addModel, setMainModel, assets.mainModel, assets.models])

  const loadModelFromUrl = useCallback(async (url: string): Promise<boolean> => {
    log('Loading model from URL', { url })
    setIsLoading(true)
    setError(null)

    try {
      // Verify the URL is accessible
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) {
        log('ERROR: Model file not found', response.status)
        throw new Error('Model dosyası bulunamadı')
      }

      const fileName = url.split('/').pop() || 'Model'
      addModel(url, fileName)
      
      const currentModels = assets.models || []
      if (!assets.mainModel && currentModels.length === 0) {
        setMainModel(url)
      }

      log('Model URL added successfully')
      setIsLoading(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Model yüklenirken hata oluştu'
      log('ERROR:', message)
      setError(message)
      setIsLoading(false)
      return false
    }
  }, [addModel, setMainModel, assets.mainModel, assets.models])

  return {
    isLoading,
    error,
    loadModelFromFile,
    loadModelFromUrl
  }
}

// Extend Window interface for storing file references
declare global {
  interface Window {
    __loadedModelFile?: File
    __loadedModelFiles?: File[]
    __loadedTextures?: Map<string, File>
  }
}
