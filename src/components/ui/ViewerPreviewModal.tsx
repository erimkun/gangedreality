interface ViewerPreviewModalProps {
    onClose: () => void
}

export default function ViewerPreviewModal({ onClose }: ViewerPreviewModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
            <div className="relative w-full max-w-[400px] h-[800px] max-h-full bg-black rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden flex flex-col">
                {/* Device Frame Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-2xl z-20"></div>

                {/* Status Bar Mockup */}
                <div className="h-8 bg-black w-full flex items-center justify-between px-6 pt-2 text-[10px] font-medium z-10 shrink-0">
                    <span>9:41</span>
                    <div className="flex gap-1">
                        <span>📶</span>
                        <span>🔋</span>
                    </div>
                </div>

                {/* Actual Viewer Iframe */}
                <div className="flex-1 bg-gray-900 relative">
                    <iframe
                        src="/viewer"
                        className="w-full h-full border-0"
                        title="Viewer Preview"
                    />
                </div>

                {/* Home Indicator */}
                <div className="h-5 bg-black w-full flex justify-center items-center shrink-0">
                    <div className="w-32 h-1 bg-white/20 rounded-full"></div>
                </div>
            </div>

            {/* Close Button Outside */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                title="Simülasyonu Kapat"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="absolute bottom-8 text-white/40 text-sm">
                Mobil Görünüm Simülasyonu
            </div>
        </div>
    )
}
