interface LoadingScreenProps {
  message?: string
  progress?: number // 0-100
  subMessage?: string
}

export default function LoadingScreen({ 
  message = 'Yükleniyor...', 
  progress,
  subMessage 
}: LoadingScreenProps) {
  return (
    <div className="w-full h-full bg-editor-bg flex flex-col items-center justify-center">
      <div className="relative w-20 h-20 mb-6">
        {/* Spinner */}
        <div className="absolute inset-0 border-4 border-editor-accent rounded-full animate-spin border-t-editor-highlight" />
        
        {/* Center icon or progress */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
          {progress !== undefined ? `${Math.round(progress)}%` : '🏠'}
        </div>
      </div>
      
      <p className="text-white text-lg font-medium">{message}</p>
      
      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-4 w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-editor-accent to-editor-highlight transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      
      {subMessage && (
        <p className="mt-2 text-gray-400 text-sm">{subMessage}</p>
      )}
      
      {progress === undefined && (
        <div className="mt-4 flex gap-1">
          <div className="w-2 h-2 bg-editor-highlight rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-editor-highlight rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-editor-highlight rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  )
}

// Error Screen Component
interface ErrorScreenProps {
  title?: string
  message: string
  onRetry?: () => void
  onBack?: () => void
}

export function ErrorScreen({ 
  title = 'Bir hata oluştu', 
  message, 
  onRetry, 
  onBack 
}: ErrorScreenProps) {
  return (
    <div className="w-full h-full bg-editor-bg flex flex-col items-center justify-center p-8">
      <div className="w-20 h-20 mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
        <span className="text-4xl">⚠️</span>
      </div>
      
      <h2 className="text-white text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 text-center max-w-md mb-6">{message}</p>
      
      <div className="flex gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ← Geri
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-editor-accent hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            🔄 Tekrar Dene
          </button>
        )}
      </div>
    </div>
  )
}

// Toast notification component
interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onClose?: () => void
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-yellow-600 border-yellow-500',
    info: 'bg-blue-600 border-blue-500'
  }
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  
  return (
    <div className={`fixed bottom-4 right-4 ${colors[type]} border-l-4 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50`}>
      <span>{icons[type]}</span>
      <p>{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-2 hover:opacity-70">✕</button>
      )}
    </div>
  )
}
