import { useState, useEffect } from 'react'
import ViewerContent from '../ViewerContent'

interface ViewerPreviewModalProps {
    onClose: () => void
}

export default function ViewerPreviewModal({ onClose }: ViewerPreviewModalProps) {
    const [mode, setMode] = useState<'mobile' | 'desktop'>('desktop')

    // Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 text-white" role="dialog" aria-modal="true" aria-label="Görüntüleyici Önizleme">
            
            {/* Mode Switcher */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex bg-white/10 rounded-full p-1 backdrop-blur-md border border-white/10 z-50">
                <button 
                    onClick={() => setMode('desktop')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === 'desktop' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                    Desktop
                </button>
                <button 
                    onClick={() => setMode('mobile')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === 'mobile' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                    Mobile
                </button>
            </div>

            {/* Container */}
            <div className={`relative transition-all duration-500 ease-in-out ${
                mode === 'mobile' 
                    ? 'w-full max-w-[400px] h-[800px] max-h-[90vh] bg-black rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden flex flex-col'
                    : 'w-full h-full max-w-[95vw] max-h-[90vh] bg-black rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col'
            }`}>
                
                {mode === 'mobile' && (
                    <>
                        {/* Device Frame Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-2xl z-20 pointer-events-none"></div>

                        {/* Status Bar Mockup */}
                        <div className="h-8 bg-black w-full flex items-center justify-between px-6 pt-2 text-[10px] font-medium z-10 shrink-0 pointer-events-none">
                            <span>9:41</span>
                            <div className="flex gap-1">
                                <span>📶</span>
                                <span>🔋</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Actual Viewer Content */}
                <div className="flex-1 bg-gray-900 relative overflow-hidden">
                    <ViewerContent isPreview={true} onClose={onClose} />
                </div>

                {mode === 'mobile' && (
                    /* Home Indicator */
                    <div className="h-5 bg-black w-full flex justify-center items-center shrink-0 pointer-events-none">
                        <div className="w-32 h-1 bg-white/20 rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Close Button Outside */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-50"
                title="Simülasyonu Kapat"
                aria-label="Simülasyonu Kapat"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <div className="absolute bottom-8 text-white/40 text-sm pointer-events-none">
                {mode === 'mobile' ? 'Mobil Görünüm Simülasyonu' : 'Masaüstü Görünüm Simülasyonu'}
            </div>
        </div>
    )
}
