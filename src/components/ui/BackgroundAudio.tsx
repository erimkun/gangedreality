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
  const hasStartedRef = useRef(false)
  
  useEffect(() => {
    // Create audio element
    const audio = new Audio(src)
    audio.loop = loop
    audio.volume = volume
    audio.preload = 'auto'
    audioRef.current = audio
    
    // Otomatik başlat - ilk kullanıcı etkileşiminde
    const handleFirstInteraction = () => {
      if (audioRef.current && !hasStartedRef.current) {
        hasStartedRef.current = true
        audioRef.current.play()
          .then(() => {
            console.log('Background audio started playing')
          })
          .catch((err) => {
            console.log('Audio play failed:', err)
            hasStartedRef.current = false
          })
      }
    }
    
    // Add listeners for first interaction
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction)
    document.addEventListener('touchstart', handleFirstInteraction)
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [src, loop, volume])
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [isMuted, volume])
  
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }
  
  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-4 left-4 z-50 size-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
      title={isMuted ? 'Sesi Aç' : 'Sessize Al'}
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
  )
}
