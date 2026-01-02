import { useCallback, useState } from 'react'
import { useModelLoader } from '@/hooks/useModelLoader'

interface ModelDropZoneProps {
  onModelLoaded?: (url: string) => void
}

export default function ModelDropZone({ onModelLoaded }: ModelDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { isLoading, error, loadModelFromFile } = useModelLoader()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const modelFiles = files.filter(f => 
      f.name.toLowerCase().endsWith('.glb') || 
      f.name.toLowerCase().endsWith('.gltf')
    )

    if (modelFiles.length > 0) {
      // Load all dropped models
      for (const file of modelFiles) {
        const url = await loadModelFromFile(file)
        // We only call onModelLoaded for the last one or maybe we should change the interface
        // But EditorPage ignores the argument anyway, so it's fine.
        if (url && onModelLoaded) {
          onModelLoaded(url)
        }
      }
    }
  }, [loadModelFromFile, onModelLoaded])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const url = await loadModelFromFile(file)
        if (url && onModelLoaded) {
          onModelLoaded(url)
        }
      }
    }
  }, [loadModelFromFile, onModelLoaded])

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-all duration-300
        ${isDragging ? 'bg-blue-900/80' : 'bg-black/60'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`
        bg-editor-panel rounded-2xl p-12 text-center max-w-lg mx-4
        border-2 border-dashed transition-colors
        ${isDragging ? 'border-blue-400 bg-blue-900/50' : 'border-gray-600'}
      `}>
        {isLoading ? (
          <>
            <div className="animate-spin text-6xl mb-6">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Model Yükleniyor...
            </h2>
          </>
        ) : (
          <>
            <div className="text-6xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              3D Model Yükle
            </h2>
            <p className="text-gray-400 mb-6">
              GLB veya GLTF dosyalarınızı buraya sürükleyin
              <br />
              veya aşağıdaki butona tıklayın
            </p>
            
            <label className="inline-block bg-editor-highlight hover:bg-red-600 text-white px-8 py-3 rounded-lg cursor-pointer transition-colors font-medium">
              Dosya Seç
              <input
                type="file"
                accept=".glb,.gltf"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
            
            {error && (
              <p className="mt-4 text-red-400 text-sm">{error}</p>
            )}
            
            <p className="mt-8 text-xs text-gray-500">
              Desteklenen formatlar: GLB, GLTF
            </p>
          </>
        )}
      </div>
    </div>
  )
}
