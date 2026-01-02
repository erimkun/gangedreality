import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '@/store/useProjectStore'
import { useSceneStore } from '@/store/useSceneStore'
import { useInteractionsStore } from '@/store/useInteractionsStore'
import { InteractionZone } from '@/types'
import ModelRenderer from '@/components/canvas/ModelRenderer'
import PlayerControls from '@/components/canvas/PlayerControls'
import LightingManager from '@/components/canvas/LightingManager'
import InteractionZonesManager from '@/components/canvas/InteractionZone'
import ConfiguratorPanel from '@/components/ui/ConfiguratorPanel'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { MinimapRenderer, MinimapUI } from '@/components/ui/Minimap'
import BackgroundAudio from '@/components/ui/BackgroundAudio'
import { DualJoysticks, useIsMobile, useIsPortrait, RotateDevicePopup, useNeedsJoystick } from '@/components/ui/MobileJoystick'
import { FlyControls, FlySpeedIndicator } from '@/components/canvas/FlyControls'
import EffectsManager from '@/components/canvas/EffectsManager'

type ViewMode = 'orbit' | 'player'

// Component to collect scene meshes for collision - only collects meshes marked for collision
function CollisionMeshCollector({
  onMeshesCollected,
  collisionMeshIds
}: {
  onMeshesCollected: (meshes: THREE.Object3D[]) => void
  collisionMeshIds: string[]
}) {
  const { scene } = useThree()
  const lastCollectionRef = useRef<string>('')

  useEffect(() => {
    // Debounce collection to avoid rapid updates
    const collectMeshes = () => {
      const meshes: THREE.Object3D[] = []
      const meshNames: string[] = []

      // If no collision meshes defined, return empty
      if (collisionMeshIds.length === 0) {
        if (lastCollectionRef.current !== '') {
          lastCollectionRef.current = ''
          onMeshesCollected([])
        }
        return
      }

      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const meshName = mesh.name || mesh.uuid

          // Only include meshes that are in the collision list
          if (collisionMeshIds.includes(meshName) && mesh.geometry && mesh.visible) {
            meshes.push(child)
            meshNames.push(meshName)
          }
        }
      })

      // Only update if meshes changed
      const collectionKey = meshNames.sort().join(',')
      if (collectionKey !== lastCollectionRef.current) {
        lastCollectionRef.current = collectionKey
        // Debug: console.log('[CollisionMeshCollector] Collected meshes:', meshes.length)
        onMeshesCollected(meshes)
      }
    }

    // Initial collection after scene loads - only once
    const timer = setTimeout(collectMeshes, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [scene, onMeshesCollected, collisionMeshIds])

  return null
}

export default function ViewerPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { loadProject, isLoading, projectName } = useProjectStore()
  const { environment, camera, player } = useSceneStore()
  const { zones } = useInteractionsStore()
  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()
  const { hasKeyboard } = useNeedsJoystick()

  // Collision mesh IDs from store
  const collisionMeshIds = useMemo(() => player.collisionMeshIds || [], [player.collisionMeshIds])

  const [viewMode, setViewMode] = useState<ViewMode>('orbit')
  const [activePopup, setActivePopup] = useState<typeof zones[0] | null>(null)
  // Initialize playerPosition with start position from store
  const [playerPosition, setPlayerPosition] = useState<THREE.Vector3 | null>(() => {
    if (player.startPosition) {
      return new THREE.Vector3(...player.startPosition)
    }
    return null
  })
  const [playerRotation, setPlayerRotation] = useState<number>(() => {
    if (player.startRotation) {
      return player.startRotation[1] || 0 // Y rotation
    }
    return 0
  })
  const [collisionMeshes, setCollisionMeshes] = useState<THREE.Object3D[]>([])
  const [showConfigurator, setShowConfigurator] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showRotatePopup, setShowRotatePopup] = useState(false)
  const pendingMode = useRef<ViewMode | null>(null)

  // Mobile joystick input
  const mobileInputRef = useRef({ move: { x: 0, y: 0 }, look: { x: 0, y: 0 } })

  // Refs for camera controls and screenshot
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const orbitControlsRef = useRef<any>(null)
  // Kamera başlangıç pozisyonu store'dan alınır
  const initialCameraPos = useRef(new THREE.Vector3(...(camera?.position || [5, 5, 5])))
  const initialTarget = useRef(new THREE.Vector3(...(camera?.target || [0, 0, 0])))

  // Update initial camera when store changes
  useEffect(() => {
    if (camera) {
      initialCameraPos.current.set(...camera.position)
      initialTarget.current.set(...camera.target)
    }
  }, [camera])

  // Update player position when start position changes (e.g., after project load)
  useEffect(() => {
    if (player.startPosition && !playerPosition) {
      setPlayerPosition(new THREE.Vector3(...player.startPosition))
    }
    if (player.startRotation) {
      setPlayerRotation(player.startRotation[1] || 0)
    }
  }, [player.startPosition, player.startRotation])

  // Show rotate popup when entering player mode on mobile in portrait
  useEffect(() => {
    if (viewMode === 'player' && isMobile && isPortrait) {
      setShowRotatePopup(true)
    }
  }, [viewMode, isMobile, isPortrait])

  // Player mode keyboard shortcuts (R to toggle configurator)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only in player mode and not typing in input
      if (viewMode !== 'player') return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key.toLowerCase() === 'r') {
        setShowConfigurator(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode])

  // Mobile joystick handlers
  const handleMobileMove = useCallback((x: number, y: number) => {
    mobileInputRef.current.move = { x, y }
  }, [])

  const handleMobileLook = useCallback((x: number, y: number) => {
    mobileInputRef.current.look = { x, y }
  }, [])

  // Blink transition for mode switch
  const handleModeSwitch = useCallback((newMode: ViewMode) => {
    if (newMode === viewMode || isTransitioning) return

    pendingMode.current = newMode
    setIsTransitioning(true)

    // After blink closes (500ms), switch mode
    setTimeout(() => {
      setViewMode(newMode)

      // If switching to orbit, reset the view
      if (newMode === 'orbit' && orbitControlsRef.current) {
        orbitControlsRef.current.object.position.copy(initialCameraPos.current)
        orbitControlsRef.current.target.copy(initialTarget.current)
        orbitControlsRef.current.update()
      }

      // After mode switch, open eyes smoothly (500ms)
      setTimeout(() => {
        setIsTransitioning(false)
        pendingMode.current = null
      }, 150)
    }, 500)
  }, [viewMode, isTransitioning])

  // Screenshot function
  const handleScreenshot = useCallback(() => {
    if (!canvasRef.current) return

    const link = document.createElement('a')
    link.download = `${projectName || projectId || 'screenshot'}_${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }, [projectName, projectId])

  // Reset view function
  const handleResetView = useCallback(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.object.position.copy(initialCameraPos.current)
      orbitControlsRef.current.target.copy(initialTarget.current)
      orbitControlsRef.current.update()
    }
  }, [])

  // Callback for collision mesh collection
  const handleMeshesCollected = useCallback((meshes: THREE.Object3D[]) => {
    setCollisionMeshes(meshes)
  }, [])

  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId, loadProject])

  // Check for interaction zone triggers
  const handlePlayerPositionChange = useCallback((position: THREE.Vector3, rotationY: number) => {
    setPlayerPosition(position)
    setPlayerRotation(rotationY)

    // Check if player is inside any interaction zone
    for (const zone of zones) {
      const zonePos = new THREE.Vector3(...zone.position)
      const distance = position.distanceTo(zonePos)

      if (distance < zone.radius) {
        if (!activePopup || activePopup.id !== zone.id) {
          setActivePopup(zone)
        }
        return
      }
    }

    // No zone triggered, clear popup
    if (activePopup) {
      setActivePopup(null)
    }
  }, [zones, activePopup])

  if (isLoading) {
    return <LoadingScreen message="Proje yükleniyor..." />
  }

  return (
    <div className="w-full h-full relative">
      {/* Blink Transition Overlay */}
      <div
        className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
        style={{ backgroundColor: '#000' }}
      >
        {/* Top eyelid */}
        <div
          className={`absolute top-0 left-0 right-0 bg-black transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isTransitioning ? 'translate-y-0' : '-translate-y-full'
            }`}
          style={{ height: '50%' }}
        />
        {/* Bottom eyelid */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-black transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isTransitioning ? 'translate-y-0' : 'translate-y-full'
            }`}
          style={{ height: '50%' }}
        />
      </div>

      {/* 3D Canvas */}
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{
            position: camera?.position || [5, 5, 5],
            fov: camera?.fov || 50,
            near: 0.001,
            far: 2000
          }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: false
          }}
          dpr={[1, 2]} // Adaptive DPR for performance
          performance={{ min: 0.5 }} // Throttle when needed
          onCreated={({ gl }) => {
            canvasRef.current = gl.domElement
          }}
        >
          {/* Default ambient light */}
          <ambientLight intensity={0.3} />

          {/* Dynamic Lights from Store */}
          <LightingManager showHelpers={false} />

          {/* Environment */}
          {environment.hdriPreset !== 'custom' ? (
            <Environment
              preset={environment.hdriPreset || 'apartment'}
              background={environment.showBackground || false}
            />
          ) : environment.customHdriUrl ? (
            <Environment
              files={environment.customHdriUrl}
              background={environment.showBackground || false}
            />
          ) : (
            <Environment
              preset="apartment"
              background={environment.showBackground || false}
            />
          )}

          {/* Model */}
          <ModelRenderer />

          {/* Interaction Zones (invisible in viewer/player) */}
          <InteractionZonesManager
            isEditor={false}
            playerPosition={playerPosition || undefined}
          />

          {/* Controls based on mode */}
          {viewMode === 'orbit' && (
            <>
              <OrbitControls
                ref={orbitControlsRef}
                makeDefault
                enableDamping
                dampingFactor={0.05}
                minDistance={0.5}
                maxDistance={200}
                target={initialTarget.current}
                mouseButtons={{
                  LEFT: THREE.MOUSE.PAN,
                  MIDDLE: THREE.MOUSE.DOLLY,
                  RIGHT: THREE.MOUSE.ROTATE
                }}
              />
              {/* Fly Controls - Left click + WASD */}
              <FlyControls />
            </>
          )}

          {viewMode === 'player' && (
            <PlayerControls
              enabled={true}
              onPositionChange={handlePlayerPositionChange}
              collisionMeshes={collisionMeshes}
              mobileInput={mobileInputRef.current}
            />
          )}

          {/* Collect collision meshes (always, not just in player mode) */}
          <CollisionMeshCollector
            onMeshesCollected={handleMeshesCollected}
            collisionMeshIds={collisionMeshIds}
          />

          {/* Minimap Renderer (inside Canvas - renders scene from top) */}
          {viewMode === 'player' && (
            <MinimapRenderer
              playerPosition={playerPosition}
              viewRange={10}
            />
          )}

          {/* Post-Processing Effects */}
          <EffectsManager />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* Minimal Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
          {/* Left - Project Info */}
          <div className="flex items-center gap-3 bg-[#111618]/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 pointer-events-auto max-w-[calc(100%-200px)] md:max-w-md">
            <Link to="/" className="text-white/60 hover:text-primary transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="w-px h-5 bg-white/20 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-white text-sm font-medium truncate" title={projectName || projectId}>
                {projectName || projectId}
              </h1>
              <p className="text-white/50 text-[10px] uppercase tracking-wider">
                {viewMode === 'orbit' ? '3D Viewer' : 'Player Mode'}
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Floating Navigation Bar - Referans UI */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-fade-in-up">
          <div className="flex items-center p-1.5 bg-[#111618]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl gap-1">
            {/* View Toggles */}
            <div className="flex items-center gap-1 px-1">
              <button
                onClick={() => handleModeSwitch('orbit')}
                title="Orbit Görünümü"
                disabled={isTransitioning}
                className={`relative flex items-center justify-center size-10 rounded-full transition-colors ${viewMode === 'orbit'
                  ? 'bg-primary text-editor-bg shadow-lg shadow-primary/30'
                  : 'text-white hover:bg-white/10'
                  } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </button>
              <button
                onClick={() => handleModeSwitch('player')}
                title="Yürüyüş Modu"
                disabled={isTransitioning}
                className={`relative flex items-center justify-center size-10 rounded-full transition-colors ${viewMode === 'player'
                  ? 'bg-primary text-editor-bg shadow-lg shadow-primary/30'
                  : 'text-white hover:bg-white/10'
                  } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Tools */}
            <div className="flex items-center gap-1 px-1">
              <button
                onClick={handleResetView}
                title="Görünümü Sıfırla"
                className="relative flex items-center justify-center size-10 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleScreenshot}
                title="Ekran Görüntüsü"
                className="relative flex items-center justify-center size-10 rounded-full text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Fly Speed Indicator (orbit modunda sağ tık + scroll ile) */}
        {viewMode === 'orbit' && <FlySpeedIndicator />}

        {/* Background Audio */}
        <BackgroundAudio src="/Sound.mp3" volume={0.15} />

        {/* Player Mode - Minimap UI (outside Canvas) */}
        {viewMode === 'player' && (
          <MinimapUI
            playerRotation={playerRotation}
            size={180}
          />
        )}

        {/* Player Mode - Mobile Joysticks (only on touch devices without keyboard) */}
        {viewMode === 'player' && (
          <DualJoysticks
            onMoveInput={handleMobileMove}
            onLookInput={handleMobileLook}
          />
        )}

        {/* Player Mode Instructions - Show only when keyboard detected */}
        {viewMode === 'player' && hasKeyboard && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-center hidden md:block">
            <p className="text-white/70 text-sm bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/5">
              🖱️ Ekrana tıklayın → Mouse ile bakın | WASD hareket | R = Özelleştir | ESC = Çık
            </p>
          </div>
        )}

        {/* Configurator Panel - Available in both modes */}
        <ConfiguratorPanel
          isOpen={showConfigurator}
          onToggle={() => setShowConfigurator(!showConfigurator)}
        />

        {/* Interaction Popup */}
        {activePopup && viewMode === 'player' && (
          <StyledPopup zone={activePopup} />
        )}

        {/* Rotate Device Popup for mobile portrait mode */}
        {showRotatePopup && isMobile && isPortrait && viewMode === 'player' && (
          <RotateDevicePopup onDismiss={() => setShowRotatePopup(false)} />
        )}
      </div>
    </div>
  )
}

// Styled Popup Component with full style support
function StyledPopup({ zone }: { zone: InteractionZone }) {
  const style = zone.popup.style

  const shadowClasses: Record<string, string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-2xl shadow-black/50'
  }

  const padding = style.padding || 20
  const borderRadius = style.borderRadius || 16
  const backdropBlur = style.backdropBlur || 20
  const maxWidth = style.maxWidth || 340
  const shadowSize = style.shadowSize || 'xl'

  return (
    <div className="absolute top-20 left-4 animate-fade-in-up">
      <div
        className={`overflow-hidden ${shadowClasses[shadowSize]}`}
        style={{
          backgroundColor: style.backgroundColor,
          color: style.textColor,
          opacity: style.opacity,
          padding: `${padding}px`,
          borderRadius: `${borderRadius}px`,
          borderWidth: `${style.borderWidth || 1}px`,
          borderColor: style.borderColor || 'rgba(255,255,255,0.1)',
          borderStyle: 'solid',
          backdropFilter: `blur(${backdropBlur}px)`,
          maxWidth: `${maxWidth}px`,
          width: '100%'
        }}
      >
        {/* Header with media */}
        {zone.popup.mediaType === 'image' && zone.popup.mediaUrl && (
          <div
            className="relative h-32 bg-cover bg-center mb-4"
            style={{
              marginLeft: `-${padding}px`,
              marginRight: `-${padding}px`,
              marginTop: `-${padding}px`,
              borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
              backgroundImage: `url(${zone.popup.mediaUrl})`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
        )}

        <h2 className="text-xl font-bold mb-2">{zone.popup.title}</h2>
        <p className="text-sm leading-relaxed opacity-80 mb-4">{zone.popup.content}</p>

        {zone.popup.mediaType === 'video' && zone.popup.mediaUrl && (
          <video src={zone.popup.mediaUrl} controls className="w-full rounded-lg mb-4" />
        )}

        <p className="text-center text-[10px] mt-3 opacity-50">Alandan uzaklaşarak kapatın</p>
      </div>
    </div>
  )
}
