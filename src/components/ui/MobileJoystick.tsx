import { useRef, useState, useEffect, useCallback } from 'react'

interface JoystickProps {
  onMove: (x: number, y: number) => void
  onEnd?: () => void
  size?: number
  baseColor?: string
  stickColor?: string
  position?: 'left' | 'right'
  label?: string
}

export default function MobileJoystick({ 
  onMove, 
  onEnd,
  size = 100,
  baseColor = 'rgba(255,255,255,0.1)',
  stickColor = '#D0BB95',
  position = 'left',
  label
}: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 })
  const touchIdRef = useRef<number | null>(null)
  const centerRef = useRef({ x: 0, y: 0 })
  
  const maxDistance = size / 2 - 15 // Max distance stick can move
  
  const handleStart = useCallback((clientX: number, clientY: number, touchId?: number) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
    
    if (touchId !== undefined) {
      touchIdRef.current = touchId
    }
    
    setIsDragging(true)
    
    // Calculate initial position
    const deltaX = clientX - centerRef.current.x
    const deltaY = clientY - centerRef.current.y
    updatePosition(deltaX, deltaY)
  }, [])
  
  const updatePosition = useCallback((deltaX: number, deltaY: number) => {
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Clamp to max distance
    let x = deltaX
    let y = deltaY
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX)
      x = Math.cos(angle) * maxDistance
      y = Math.sin(angle) * maxDistance
    }
    
    setStickPosition({ x, y })
    
    // Normalize values to -1 to 1 range
    const normalizedX = x / maxDistance
    const normalizedY = y / maxDistance
    
    onMove(normalizedX, normalizedY)
  }, [maxDistance, onMove])
  
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return
    
    const deltaX = clientX - centerRef.current.x
    const deltaY = clientY - centerRef.current.y
    updatePosition(deltaX, deltaY)
  }, [isDragging, updatePosition])
  
  const handleEnd = useCallback(() => {
    setIsDragging(false)
    setStickPosition({ x: 0, y: 0 })
    touchIdRef.current = null
    onMove(0, 0)
    onEnd?.()
  }, [onMove, onEnd])
  
  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY, touch.identifier)
  }, [handleStart])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    // Find the touch that started this joystick
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchIdRef.current) {
        handleMove(e.touches[i].clientX, e.touches[i].clientY)
        break
      }
    }
  }, [handleMove])
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Check if our touch ended
    let found = false
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchIdRef.current) {
        found = true
        break
      }
    }
    
    if (!found) {
      handleEnd()
    }
  }, [handleEnd])
  
  // Mouse event handlers (for testing on desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }, [handleStart])
  
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }
    
    const handleMouseUp = () => {
      handleEnd()
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMove, handleEnd])
  
  const positionClasses = position === 'left' 
    ? 'left-6 bottom-28' 
    : 'right-6 bottom-28'
  
  return (
    <div 
      ref={containerRef}
      className={`absolute ${positionClasses} z-50 touch-none select-none`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{ width: size, height: size }}
    >
      {/* Label */}
      {label && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 uppercase tracking-wider whitespace-nowrap">
          {label}
        </div>
      )}
      
      {/* Base Circle */}
      <div 
        className="absolute inset-0 rounded-full border-2 border-white/20 transition-colors"
        style={{ 
          backgroundColor: baseColor,
          boxShadow: isDragging ? '0 0 20px rgba(208, 187, 149, 0.3)' : 'none'
        }}
      />
      
      {/* Inner Circle Guide */}
      <div 
        className="absolute rounded-full border border-white/10"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          left: size * 0.2,
          top: size * 0.2
        }}
      />
      
      {/* Stick */}
      <div 
        className="absolute rounded-full shadow-lg transition-transform"
        style={{
          width: 40,
          height: 40,
          backgroundColor: stickColor,
          left: size / 2 - 20 + stickPosition.x,
          top: size / 2 - 20 + stickPosition.y,
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isDragging 
            ? `0 4px 20px rgba(208, 187, 149, 0.5)` 
            : '0 2px 10px rgba(0,0,0,0.3)'
        }}
      >
        {/* Stick inner detail */}
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)`
          }}
        />
      </div>
      
      {/* Direction indicators */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/20" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/20" />
      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20" />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20" />
    </div>
  )
}

// Hook to detect if device needs joystick (touch device without keyboard)
export function useNeedsJoystick() {
  const [needsJoystick, setNeedsJoystick] = useState(false)
  const [hasKeyboard, setHasKeyboard] = useState(true)
  
  useEffect(() => {
    const checkDevice = () => {
      // Check if it's a touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Check screen size (mobile/tablet)
      const isSmallScreen = window.innerWidth < 1024
      
      // Detect keyboard - if user presses any key, they have a keyboard
      const handleKeyDown = () => {
        setHasKeyboard(true)
        setNeedsJoystick(false)
      }
      
      window.addEventListener('keydown', handleKeyDown, { once: true })
      
      // Initial check: touch device with small screen likely needs joystick
      if (isTouchDevice && isSmallScreen) {
        setNeedsJoystick(true)
        setHasKeyboard(false)
      } else {
        setNeedsJoystick(false)
        setHasKeyboard(true)
      }
      
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return { needsJoystick, hasKeyboard }
}

// Hook to detect if device is mobile/touch
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
        window.innerWidth < 1024
      )
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

// Hook to detect portrait mode on mobile
export function useIsPortrait() {
  const [isPortrait, setIsPortrait] = useState(false)
  
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])
  
  return isPortrait
}

// Rotate Device Popup
export function RotateDevicePopup({ onDismiss }: { onDismiss?: () => void }) {
  const [show, setShow] = useState(true)
  
  if (!show) return null
  
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-6">
      <div className="bg-[#111618] border border-white/10 rounded-2xl p-8 max-w-sm text-center">
        {/* Rotate animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <svg className="w-20 h-20 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
              <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          {/* Rotation arrow */}
          <div className="absolute -right-2 top-1/2 -translate-y-1/2">
            <svg className="w-8 h-8 text-primary animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-white text-xl font-bold mb-2">
          📱 Telefonunuzu Yan Çevirin
        </h3>
        <p className="text-white/60 text-sm mb-6">
          Daha iyi bir deneyim için cihazınızı yatay konuma getirin
        </p>
        
        <button
          onClick={() => {
            setShow(false)
            onDismiss?.()
          }}
          className="w-full bg-primary hover:bg-primary/80 text-editor-bg font-bold py-3 rounded-xl transition-colors"
        >
          Anladım
        </button>
      </div>
    </div>
  )
}

// Dual joystick component for player mode
export function DualJoysticks({ 
  onMoveInput, 
  onLookInput 
}: { 
  onMoveInput: (x: number, y: number) => void
  onLookInput: (x: number, y: number) => void 
}) {
  const { needsJoystick } = useNeedsJoystick()
  
  if (!needsJoystick) return null
  
  return (
    <>
      <MobileJoystick 
        position="left"
        onMove={onMoveInput}
        label="Hareket"
        size={120}
      />
      <MobileJoystick 
        position="right"
        onMove={onLookInput}
        label="Bakış"
        size={120}
      />
    </>
  )
}
