import { useToastStore, ToastType } from '@/store/useToastStore'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  
  if (toasts.length === 0) return null
  
  const colors: Record<ToastType, string> = {
    success: 'bg-green-600 border-green-400',
    error: 'bg-red-600 border-red-400',
    warning: 'bg-yellow-600 border-yellow-400',
    info: 'bg-blue-600 border-blue-400'
  }
  
  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          role="alert"
          className={`${colors[toast.type]} border-l-4 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up`}
        >
          <span className="text-lg">{icons[toast.type]}</span>
          <p className="flex-1 text-sm">{toast.message}</p>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="hover:opacity-70 text-white/70"
            aria-label="Bildirimi kapat"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
