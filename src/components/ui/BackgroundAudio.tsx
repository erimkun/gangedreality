import { useEffect, useRef, useState } from 'react'

interface BackgroundAudioProps {
  src: string
  volume?: number
  loop?: boolean
}

export default function BackgroundAudio({ 
  src, 
  volume = 0.15, 
  loop = true
}: BackgroundAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const hasStartedRef = useRef(false)
  const tryStartPlayback = useRef<(() => void) | null>(null)
  
  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = loop
    audio.volume = volume
    audio.preload = 'auto'
    audio.setAttribute('playsinline', 'true')
    audioRef.current = audio
    
    const handleFirstInteraction = () => {
      if (audioRef.current && !hasStartedRef.current) {
        hasStartedRef.current = true
        audioRef.current.play()
          .then(() => {
            setIsStarted(true)
          })
          .catch(() => {
            hasStartedRef.current = false
          })
      }
    }
    tryStartPlayback.current = handleFirstInteraction
    
    window.addEventListener('pointerdown', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
    
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      hasStartedRef.current = false
      setIsStarted(false)
    }
  }, [src, loop, volume])
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [isMuted, volume])
  
  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev
      if (prev) {
        queueMicrotask(() => tryStartPlayback.current?.())
      }
      return nextMuted
    })
  }

  const handleManualStart = () => {
    tryStartPlayback.current?.()
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
      {!isStarted && !isMuted && (
        <button
          onClick={handleManualStart}
          className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs text-white/75 backdrop-blur-sm hover:bg-black/60 hover:text-white"
        >
          Sesi Başlat
        </button>
      )}
      <button
        onClick={toggleMute}
        className="size-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
        title={!isStarted && !isMuted ? 'Sesi Başlat' : isMuted ? 'Sesi Aç' : 'Sessize Al'}
        aria-label={!isStarted && !isMuted ? 'Sesi Başlat' : isMuted ? 'Sesi Aç' : 'Sessize Al'}
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
    </div>
  )
}
