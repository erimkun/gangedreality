import { useState } from 'react'

interface NewProjectDialogProps {
  projectId: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

export default function NewProjectDialog({ projectId, onConfirm, onCancel }: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (projectName.trim()) {
      onConfirm(projectName.trim())
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-editor-panel rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-editor-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🏗️</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Proje Bulunamadı</h2>
          <p className="text-gray-400 mt-2">
            <code className="bg-editor-bg px-2 py-1 rounded text-editor-highlight">
              {projectId}
            </code>
            {' '}için kayıtlı bir proje yok.
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yeni proje oluşturmak ister misiniz?
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Proje adı (örn: Örnek Daire A)"
              className="w-full bg-editor-bg border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-editor-highlight transition-colors"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!projectName.trim()}
              className="flex-1 bg-editor-highlight hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors font-medium"
            >
              Oluştur
            </button>
          </div>
        </form>
        
        {/* Tips */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            💡 İpucu: Proje ID'si URL'de görünecek şekilde otomatik olarak 
            <code className="text-editor-highlight ml-1">{projectId}</code> 
            olarak ayarlanacaktır.
          </p>
        </div>
      </div>
    </div>
  )
}
