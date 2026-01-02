import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'

// Global minimap state (simple pub-sub pattern)
let minimapImageCallback: ((image: string | null) => void) | null = null

export function setMinimapCallback(cb: ((image: string | null) => void) | null) {
  minimapImageCallback = cb
}

interface MinimapProps {
  playerPosition?: THREE.Vector3 | null
  playerRotation?: number // Y rotation in radians
  size?: number
  zoom?: number
}

// This component renders inside the Canvas
export function MinimapCamera({ 
  playerPosition,
  onRender 
}: { 
  playerPosition?: THREE.Vector3 | null
  onRender: (dataUrl: string) => void 
}) {
  const { scene, gl } = useThree()
  const minimapCamera = useRef<THREE.OrthographicCamera | null>(null)
  const renderTarget = useRef<THREE.WebGLRenderTarget | null>(null)
  const frameCount = useRef(0)
  
  useEffect(() => {
    // Create orthographic camera for top-down view
    const size = 50
    minimapCamera.current = new THREE.OrthographicCamera(
      -size, size, size, -size, 0.1, 1000
    )
    minimapCamera.current.position.set(0, 100, 0)
    minimapCamera.current.lookAt(0, 0, 0)
    minimapCamera.current.up.set(0, 0, -1)
    
    // Create render target
    renderTarget.current = new THREE.WebGLRenderTarget(256, 256, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    })
    
    return () => {
      renderTarget.current?.dispose()
    }
  }, [])
  
  useFrame(() => {
    if (!minimapCamera.current || !renderTarget.current) return
    
    // Update every 10 frames for performance
    frameCount.current++
    if (frameCount.current % 10 !== 0) return
    
    // Update camera position to follow player
    if (playerPosition) {
      minimapCamera.current.position.x = playerPosition.x
      minimapCamera.current.position.z = playerPosition.z
      minimapCamera.current.lookAt(playerPosition.x, 0, playerPosition.z)
    }
    
    // Render to texture
    const currentRenderTarget = gl.getRenderTarget()
    gl.setRenderTarget(renderTarget.current)
    gl.render(scene, minimapCamera.current)
    gl.setRenderTarget(currentRenderTarget)
    
    // Convert to data URL (expensive, only do occasionally)
    if (frameCount.current % 30 === 0) {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const pixels = new Uint8Array(256 * 256 * 4)
        gl.readRenderTargetPixels(renderTarget.current, 0, 0, 256, 256, pixels)
        
        const imageData = ctx.createImageData(256, 256)
        // Flip Y axis
        for (let y = 0; y < 256; y++) {
          for (let x = 0; x < 256; x++) {
            const srcIdx = ((255 - y) * 256 + x) * 4
            const dstIdx = (y * 256 + x) * 4
            imageData.data[dstIdx] = pixels[srcIdx]
            imageData.data[dstIdx + 1] = pixels[srcIdx + 1]
            imageData.data[dstIdx + 2] = pixels[srcIdx + 2]
            imageData.data[dstIdx + 3] = pixels[srcIdx + 3]
          }
        }
        ctx.putImageData(imageData, 0, 0)
        onRender(canvas.toDataURL())
      }
    }
  })
  
  return null
}

// Canvas INSIDE - Only renders the scene to texture and sends image via callback
export function MinimapRenderer({ 
  playerPosition,
  viewRange = 50
}: { 
  playerPosition?: THREE.Vector3 | null
  viewRange?: number 
}) {
  const { scene, gl } = useThree()
  
  const minimapCamera = useRef<THREE.OrthographicCamera | null>(null)
  const renderTarget = useRef<THREE.WebGLRenderTarget | null>(null)
  const frameCount = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const resolution = 256
  
  // Setup camera and render target
  useEffect(() => {
    // Create orthographic camera for top-down view
    const halfSize = viewRange / 2
    minimapCamera.current = new THREE.OrthographicCamera(
      -halfSize, halfSize, halfSize, -halfSize, 1, 500
    )
    minimapCamera.current.up.set(0, 0, -1) // North is up
    
    // Create render target
    renderTarget.current = new THREE.WebGLRenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    })
    
    // Create reusable canvas
    canvasRef.current = document.createElement('canvas')
    canvasRef.current.width = resolution
    canvasRef.current.height = resolution
    
    console.log('[MinimapRenderer] Initialized')
    
    return () => {
      renderTarget.current?.dispose()
      console.log('[MinimapRenderer] Disposed')
    }
  }, [viewRange])
  
  // Render minimap every few frames
  useFrame(() => {
    if (!minimapCamera.current || !renderTarget.current || !canvasRef.current) return
    
    frameCount.current++
    if (frameCount.current % 6 !== 0) return // Render every 6 frames
    
    // Position camera above player
    const camX = playerPosition?.x || 0
    const camZ = playerPosition?.z || 0
    minimapCamera.current.position.set(camX, 150, camZ)
    minimapCamera.current.lookAt(camX, 0, camZ)
    
    // Save current state
    const currentRenderTarget = gl.getRenderTarget()
    
    // Render scene to texture
    gl.setRenderTarget(renderTarget.current)
    gl.clear()
    gl.render(scene, minimapCamera.current)
    gl.setRenderTarget(currentRenderTarget)
    
    // Convert to image every 12 frames
    if (frameCount.current % 12 === 0 && minimapImageCallback) {
      try {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          const pixels = new Uint8Array(resolution * resolution * 4)
          gl.readRenderTargetPixels(renderTarget.current, 0, 0, resolution, resolution, pixels)
          
          const imageData = ctx.createImageData(resolution, resolution)
          // Flip Y axis
          for (let y = 0; y < resolution; y++) {
            for (let x = 0; x < resolution; x++) {
              const srcIdx = ((resolution - 1 - y) * resolution + x) * 4
              const dstIdx = (y * resolution + x) * 4
              imageData.data[dstIdx] = pixels[srcIdx]
              imageData.data[dstIdx + 1] = pixels[srcIdx + 1]
              imageData.data[dstIdx + 2] = pixels[srcIdx + 2]
              imageData.data[dstIdx + 3] = 255
            }
          }
          ctx.putImageData(imageData, 0, 0)
          minimapImageCallback(canvasRef.current.toDataURL('image/png'))
        }
      } catch (e) {
        console.error('[MinimapRenderer] Error:', e)
      }
    }
  })
  
  return null
}

// Canvas OUTSIDE - UI component that displays the minimap image
export function MinimapUI({ 
  playerRotation = 0,
  size = 180
}: { 
  playerRotation?: number
  size?: number 
}) {
  const [minimapImage, setMinimapImage] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  // Subscribe to minimap updates
  useEffect(() => {
    setMinimapCallback(setMinimapImage)
    console.log('[MinimapUI] Subscribed to updates')
    return () => {
      setMinimapCallback(null)
      console.log('[MinimapUI] Unsubscribed')
    }
  }, [])
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Update rotation
  useEffect(() => {
    const degrees = (playerRotation * 180 / Math.PI) % 360
    setRotation(-degrees)
  }, [playerRotation])
  
  const displaySize = isMobile ? 120 : size
  
  return (
    <div 
      className="absolute top-4 right-4 z-50"
      style={{ width: displaySize, height: displaySize }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-primary/40 bg-[#111]/95 shadow-2xl">
        {/* Rendered 3D Scene */}
        {minimapImage ? (
          <img 
            src={minimapImage} 
            alt="Minimap" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1f22]">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] text-white/40 mt-2">Yükleniyor...</p>
            </div>
          </div>
        )}
        
        {/* Player indicator at center */}
        <div 
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <div 
            style={{ 
              width: isMobile ? 20 : 28,
              height: isMobile ? 20 : 28,
              transform: `rotate(${rotation}deg)`
            }}
          >
            <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-lg">
              <defs>
                <filter id="minimapGlow2" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#fff" floodOpacity="0.8"/>
                </filter>
              </defs>
              <polygon 
                points="16,4 24,26 16,20 8,26" 
                fill="#FFD700"
                stroke="#fff" 
                strokeWidth="2"
                filter="url(#minimapGlow2)"
              />
            </svg>
          </div>
        </div>
        
        {/* Compass */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <div className="text-primary text-xs font-bold px-2 py-0.5 bg-black/60 rounded">
            N
          </div>
        </div>
        
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/50 rounded-tl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/50 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/50 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/50 rounded-br" />
      </div>
    </div>
  )
}

// Legacy: Keep old TopDownMinimap for backwards compatibility (now uses new system)
export function TopDownMinimap(_props: MinimapProps & { viewRange?: number }) {
  // This is now a no-op, use MinimapRenderer + MinimapUI instead
  return null
}

// UI component that displays the minimap (placeholder for future WebGL-based minimap)
export default function Minimap({ 
  size = 150 
}: MinimapProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const displaySize = isExpanded ? size * 1.5 : size
  
  return (
    <div 
      className="absolute top-4 right-4 z-50 transition-all duration-300"
      style={{ width: displaySize, height: displaySize }}
    >
      {/* Minimap Container */}
      <div 
        className="relative w-full h-full rounded-xl overflow-hidden border-2 border-white/20 bg-[#111618]/80 backdrop-blur-sm shadow-2xl cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20% 20%'
          }}
        />
        
        {/* Player Indicator (center dot) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse" />
          {/* Direction indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-primary" />
          </div>
        </div>
        
        {/* Compass */}
        <div className="absolute top-2 right-2 text-[10px] font-bold text-white/60 bg-black/40 px-1.5 py-0.5 rounded">
          N
        </div>
        
        {/* Expand Icon */}
        <div className="absolute bottom-1 right-1 text-white/40">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isExpanded ? "M6 18L18 6M6 6l12 12" : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"} />
          </svg>
        </div>
      </div>
      
      {/* Label */}
      <div className="absolute -top-6 left-0 text-[10px] text-white/50 uppercase tracking-wider">
        Minimap
      </div>
    </div>
  )
}

// Simple CSS-based minimap that shows player position and coordinates
export function SimpleMinimap({ 
  playerPosition,
  playerRotation = 0,
  size = 180 // Desktop default - larger
}: MinimapProps) {
  const [rotation, setRotation] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  // Track visited positions to show trail (relative to current position)
  const [visitedPositions, setVisitedPositions] = useState<{x: number, z: number}[]>([])
  const lastTrailPosRef = useRef<{x: number, z: number} | null>(null)
  
  // Radar range - how far the minimap shows (in world units)
  const radarRange = 30 // 30 units radius around player
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Calculate responsive size
  const displaySize = isMobile ? 100 : size
  
  // Track player trail
  useEffect(() => {
    if (playerPosition) {
      const currentPos = { x: playerPosition.x, z: playerPosition.z }
      
      // Only add to trail if moved significantly
      if (!lastTrailPosRef.current || 
          Math.abs(currentPos.x - lastTrailPosRef.current.x) > 2 ||
          Math.abs(currentPos.z - lastTrailPosRef.current.z) > 2) {
        lastTrailPosRef.current = currentPos
        setVisitedPositions(prev => {
          const newTrail = [...prev, currentPos]
          // Keep only last 30 positions for trail
          return newTrail.slice(-30)
        })
      }
    }
  }, [playerPosition])
  
  useEffect(() => {
    // Convert radians to degrees and normalize
    const degrees = (playerRotation * 180 / Math.PI) % 360
    setRotation(-degrees) // Negative because CSS rotation is clockwise
  }, [playerRotation])
  
  // Calculate trail positions relative to player (radar style - player always center)
  const getTrailPosition = (trailPos: {x: number, z: number}) => {
    if (!playerPosition) return { x: 50, z: 50 }
    
    // Calculate relative position from player
    const relX = trailPos.x - playerPosition.x
    const relZ = trailPos.z - playerPosition.z
    
    // Normalize to 0-100 based on radar range (player is always at 50,50)
    const normX = 50 + (relX / radarRange) * 45
    const normZ = 50 + (relZ / radarRange) * 45
    
    return {
      x: Math.max(5, Math.min(95, normX)),
      z: Math.max(5, Math.min(95, normZ))
    }
  }
  
  return (
    <div 
      className="absolute top-4 right-4 z-50 transition-all duration-300"
      style={{ width: displaySize, height: displaySize }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-[#1a1f22]/98 to-[#0d1012]/98 backdrop-blur-md shadow-2xl">
        {/* World terrain representation */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 40%, rgba(76, 85, 75, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 60%, rgba(59, 67, 58, 0.25) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 80%, rgba(45, 52, 44, 0.2) 0%, transparent 45%),
              linear-gradient(135deg, #1a201c 0%, #0f1411 100%)
            `
          }}
        />
        
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(208, 187, 149, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(208, 187, 149, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: isMobile ? '10px 10px' : '15px 15px'
          }}
        />
        
        {/* Outer border glow */}
        <div className="absolute inset-0 rounded-2xl" style={{
          boxShadow: 'inset 0 0 20px rgba(208, 187, 149, 0.1)'
        }} />
        
        {/* Circular radar sweep effect (subtle) */}
        <div 
          className="absolute inset-4 rounded-full border border-primary/10"
          style={{
            background: 'radial-gradient(circle, transparent 60%, rgba(208, 187, 149, 0.05) 100%)'
          }}
        />
        
        {/* Player trail - shows where player has been (radar style) */}
        {playerPosition && visitedPositions.map((pos, idx) => {
          const trailPos = getTrailPosition(pos)
          const opacity = ((idx + 1) / visitedPositions.length) * 0.6 // Fade older positions
          
          return (
            <div
              key={idx}
              className="absolute rounded-full bg-primary/60"
              style={{
                left: `${trailPos.x}%`,
                top: `${trailPos.z}%`,
                width: isMobile ? 3 : 5,
                height: isMobile ? 3 : 5,
                opacity,
                transform: 'translate(-50%, -50%)'
              }}
            />
          )
        })}
        
        {/* Player position indicator - ALWAYS at center (radar style) */}
        <div 
          className="absolute"
          style={{ 
            left: '50%', 
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Player dot with direction */}
          <div 
            className="relative"
            style={{ 
              width: isMobile ? 20 : 28,
              height: isMobile ? 20 : 28,
              transform: `rotate(${rotation}deg)`
            }}
          >
            <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-lg">
              <defs>
                <filter id="playerGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E8D5A3"/>
                  <stop offset="100%" stopColor="#C4A66B"/>
                </linearGradient>
              </defs>
              {/* Arrow body pointing up */}
              <polygon 
                points="16,2 26,28 16,22 6,28" 
                fill="url(#arrowGrad)" 
                stroke="#fff" 
                strokeWidth="1.5"
                filter="url(#playerGlow)"
              />
              {/* Center dot */}
              <circle cx="16" cy="18" r="3" fill="#fff" opacity="0.8"/>
            </svg>
          </div>
          
        </div>
        
        {/* Compass - top center */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 text-[9px] font-bold">
            <span className="text-white/30">W</span>
            <span className="text-primary text-xs px-1.5 py-0.5 bg-black/50 rounded">N</span>
            <span className="text-white/30">E</span>
          </div>
        </div>
        
        {/* South indicator */}
        {!isMobile && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[8px] font-bold text-white/20">
            S
          </div>
        )}
        
        {/* Side compass indicators */}
        {!isMobile && (
          <>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[8px] font-bold text-white/20">
              W
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[8px] font-bold text-white/20">
              E
            </div>
          </>
        )}
      </div>
    </div>
  )
}
