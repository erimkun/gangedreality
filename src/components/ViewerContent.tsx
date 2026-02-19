import { Link } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '@/store/useProjectStore'
import { useSceneStore } from '@/store/useSceneStore'
import { useInteractionsStore } from '@/store/useInteractionsStore'
import { InteractionZone } from '@/types'
import ModelRenderer from '@/components/canvas/ModelRenderer'
import LightingManager from '@/components/canvas/LightingManager'
import InteractionZonesManager from '@/components/canvas/InteractionZone'
import ConfiguratorPanel from '@/components/ui/ConfiguratorPanel'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { MinimapRenderer, MinimapUI } from '@/components/ui/Minimap'
import BackgroundAudio from '@/components/ui/BackgroundAudio'
import { useIsMobile, useIsPortrait, RotateDevicePopup } from '@/components/ui/MobileJoystick'
import { FlyControls, FlySpeedIndicator } from '@/components/canvas/FlyControls'
import EffectsManager from '@/components/canvas/EffectsManager'
import NodeNavigationControls from '@/components/canvas/NodeNavigationControls'
import HotspotRenderer from '@/components/canvas/HotspotRenderer'
import { useHotspotStore, HotspotNode } from '@/store/useHotspotStore'
import { FPSCounter } from '@/components/ui/FPSCounter'
import { ControlsInfo } from '@/components/ui/ControlsInfo'
import BlockRenderer from '@/components/ui/BlockRenderer'
import HdriSphere from '@/components/canvas/HdriSphere'

type ViewMode = 'orbit' | 'player'

// Camera Tracker to keep track of camera state for transitions
function CameraTracker({
  onUpdate
}: {
  onUpdate: (state: { position: THREE.Vector3, rotation: THREE.Euler, quaternion: THREE.Quaternion, target: THREE.Vector3 }) => void
}) {
  const { camera, controls } = useThree()

  useFrame(() => {
    const target = new THREE.Vector3()
    const orbit = controls as any
    if (orbit && orbit.target) {
      target.copy(orbit.target)
    } else {
      // If no controls (e.g. player mode), estimate target from rotation
      const direction = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation)
      target.copy(camera.position).add(direction.multiplyScalar(5))
    }

    onUpdate({
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      quaternion: camera.quaternion.clone(),
      target
    })
  })

  return null
}

// Camera Transition Manager
function CameraTransitionManager({
  target,
  startTarget: initialTargetProp,
  initialCameraState,
  onComplete
}: {
  target: { pos: number[], rot?: number[], lookAt?: number[] } | null
  startTarget?: THREE.Vector3
  initialCameraState?: { position: THREE.Vector3, quaternion: THREE.Quaternion } | null
  onComplete: () => void
}) {
  const { camera, controls } = useThree()
  const progress = useRef(0)
  const active = useRef(false)

  const startPos = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const startQuat = useRef(new THREE.Quaternion())
  const endPos = useRef(new THREE.Vector3())
  const endTarget = useRef(new THREE.Vector3())
  const endQuat = useRef(new THREE.Quaternion())
  const controlPoint = useRef(new THREE.Vector3())

  useEffect(() => {
    if (target && controls) {
      active.current = true
      progress.current = 0

      // Start points
      if (initialCameraState) {
        startPos.current.copy(initialCameraState.position)
        startQuat.current.copy(initialCameraState.quaternion)
      } else {
        startPos.current.copy(camera.position)
        startQuat.current.copy(camera.quaternion)
      }

      if (initialTargetProp) {
        startTarget.current.copy(initialTargetProp)
      } else {
        const orbit = controls as any
        if (orbit.target) {
          startTarget.current.copy(orbit.target)
        }
      }

      // End points
      endPos.current.set(target.pos[0], target.pos[1], target.pos[2])

      if (target.lookAt) {
        // Explicit lookAt target
        endTarget.current.set(target.lookAt[0], target.lookAt[1], target.lookAt[2])
      } else if (target.rot) {
        // Calculate look direction from rotation (YXZ order usually for player)
        // Only use pitch (X) and yaw (Y), ignore roll (Z) to prevent dizziness
        const euler = new THREE.Euler(target.rot[0], target.rot[1], 0, 'YXZ')
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler)
        // Target is position + direction
        endTarget.current.copy(endPos.current).add(direction)
      }

      // Calculate End Rotation Quaternion (also without roll via lookAt)
      const m = new THREE.Matrix4()
      m.lookAt(endPos.current, endTarget.current, new THREE.Vector3(0, 1, 0))
      endQuat.current.setFromRotationMatrix(m)

      // Control point for curve (midpoint + up)
      controlPoint.current.copy(startPos.current).add(endPos.current).multiplyScalar(0.5)
      // Add some height for the "arc" effect, proportional to distance
      const distance = startPos.current.distanceTo(endPos.current)
      // Reduced height factor from 0.2 to 0.1 and base height from 2 to 0.5
      controlPoint.current.y += Math.max(0.5, distance * 0.1)

    }
  }, [target, camera, controls, initialTargetProp])

  useFrame((_state, delta) => {
    if (!active.current) return

    // Animation speed - Reduced from 0.8 to 0.4 (approx 2.5 seconds duration)
    progress.current += delta * 0.4

    if (progress.current >= 1) {
      progress.current = 1
      active.current = false

      // Sync controls at the end
      if (controls) {
        const orbit = controls as any
        if (orbit.target) {
          orbit.target.copy(endTarget.current)
          orbit.update()
        }
      }

      onComplete()
      return
    }

    const t = progress.current
    // Ease In Out Cubic
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    // Quadratic Bezier for Position
    const p0 = startPos.current
    const p1 = controlPoint.current
    const p2 = endPos.current

    const invT = 1 - easedT

    // Update Position
    camera.position.x = (invT * invT * p0.x) + (2 * invT * easedT * p1.x) + (easedT * easedT * p2.x)
    camera.position.y = (invT * invT * p0.y) + (2 * invT * easedT * p1.y) + (easedT * easedT * p2.y)
    camera.position.z = (invT * invT * p0.z) + (2 * invT * easedT * p1.z) + (easedT * easedT * p2.z)

    // Slerp Rotation (Smoother than lookAt interpolation)
    camera.quaternion.slerpQuaternions(startQuat.current, endQuat.current, easedT)
  })

  return null
}

interface ViewerContentProps {
  onClose?: () => void
  isPreview?: boolean
  projectId?: string
}

export default function ViewerContent({ onClose, isPreview = false, projectId }: ViewerContentProps) {
  const { loadProject, isLoading, projectName } = useProjectStore()
  const { environment, camera, player } = useSceneStore()
  const { zones } = useInteractionsStore()
  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()

  const [viewMode, setViewMode] = useState<ViewMode>('orbit')
  const [activePopup, setActivePopup] = useState<typeof zones[0] | null>(null)

  // Use ref for position to avoid re-renders on every frame
  const playerPositionRef = useRef<THREE.Vector3 | null>(
    player.startPosition ? new THREE.Vector3(...player.startPosition) : null
  )

  // Keep rotation in state for UI, but throttle updates
  const [playerRotation, setPlayerRotation] = useState<number>(
    player.startRotation ? (player.startRotation[1] || 0) : 0
  )
  const lastRotationUpdate = useRef(0)

  const [showConfigurator, setShowConfigurator] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showRotatePopup, setShowRotatePopup] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState<{ pos: number[], rot?: number[], lookAt?: number[] } | null>(null)
  const [transitionStartState, setTransitionStartState] = useState<{ position: THREE.Vector3, quaternion: THREE.Quaternion } | null>(null)
  const destinationMode = useRef<ViewMode | null>(null)
  const [orbitTarget, setOrbitTarget] = useState<THREE.Vector3>(new THREE.Vector3())

  // Track real-time camera state
  const cameraStateRef = useRef<{ position: THREE.Vector3, rotation: THREE.Euler, quaternion: THREE.Quaternion, target: THREE.Vector3 } | null>(null)

  // Track dismissed popup ID to prevent immediate reopening
  const dismissedPopupId = useRef<string | null>(null)

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
      setOrbitTarget(new THREE.Vector3(...camera.target))
    }
  }, [camera])

  // Update player position when start position changes (e.g., after project load)
  useEffect(() => {
    if (player.startPosition && !playerPositionRef.current) {
      playerPositionRef.current = new THREE.Vector3(...player.startPosition)
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

  // Handle click-to-teleport in Orbit mode
  useEffect(() => {
    const handleModelClick = (e: CustomEvent) => {
      if (viewMode !== 'orbit') return

      const point = e.detail.point as THREE.Vector3
      const nodes = useHotspotStore.getState().nodes // Use direct store access to get latest nodes

      if (!nodes || nodes.length === 0) return

      // Find nearest node
      let nearestNode: HotspotNode | null = null
      let minDist = Infinity

      for (const node of nodes) {
        const nodePos = new THREE.Vector3(...node.position)
        const dist = nodePos.distanceTo(point)
        if (dist < minDist) {
          minDist = dist
          nearestNode = node
        }
      }

      // If found and reasonably close (e.g. within 100 units - practically anywhere on the model)
      if (nearestNode) {
        const node = nearestNode as HotspotNode // Explicit cast to be absolutely sure
        const EYE_HEIGHT = 1.7
        const targetPos = [node.position[0], node.position[1] + EYE_HEIGHT, node.position[2]] as [number, number, number]

        // Calculate rotation from current camera to preserve view direction
        // We calculate the Yaw (Y) and Pitch (X) from the current camera direction vector
        const direction = new THREE.Vector3(0, 0, -1)
        if (cameraStateRef.current) {
          direction.applyQuaternion(cameraStateRef.current.quaternion)
        }

        const angleY = Math.atan2(-direction.x, -direction.z)
        const pitch = Math.asin(direction.y)

        // Update player start position to this node
        useSceneStore.getState().updatePlayer({
          startPosition: targetPos,
        })

        // Trigger switch to player mode with explicit target to avoid stale state
        handleModeSwitch('player', {
          pos: targetPos,
          rot: [pitch, angleY, 0] // Pass calculated rotation [Pitch, Yaw, Roll]
        })
      }
    }

    window.addEventListener('model-click-teleport' as any, handleModelClick)
    return () => window.removeEventListener('model-click-teleport' as any, handleModelClick)
  }, [viewMode]) // Removed handleModeSwitch from deps to avoid circular dependency if it changes

  // Mode switch
  const handleModeSwitch = useCallback((newMode: ViewMode, overrideTarget?: { pos: number[], rot?: number[] }) => {
    if (newMode === viewMode) return

    if (newMode === 'player') {
      // Start transition to player
      let targetPos = overrideTarget?.pos
      const targetRot = overrideTarget?.rot || player.startRotation || [0, 0, 0]

      // If no explicit target provided (e.g. Menu Click), snap to nearest node from startPosition
      if (!targetPos && player.startPosition) {
        const nodes = useHotspotStore.getState().nodes
        if (nodes && nodes.length > 0) {
          const startVec = new THREE.Vector3(...player.startPosition)
          let nearest: HotspotNode | null = null
          let minDist = Infinity

          for (const node of nodes) {
            const nodePos = new THREE.Vector3(...node.position)
            const dist = nodePos.distanceTo(startVec)
            if (dist < minDist) {
              minDist = dist
              nearest = node
            }
          }

          if (nearest) {
            const node = nearest as HotspotNode
            const EYE_HEIGHT = 1.7
            targetPos = [node.position[0], node.position[1] + EYE_HEIGHT, node.position[2]] as [number, number, number]

            // Update global store so NodeNavigationControls picks it up correctly on mount
            // This prevents "blinking" where it jumps to original startPos then to node
            useSceneStore.getState().updatePlayer({
              startPosition: targetPos as [number, number, number]
            })

            // For Menu Navigation, we respect player.startRotation (targetRot already set above)
          } else {
            targetPos = player.startPosition
          }
        } else {
          targetPos = player.startPosition
        }
      }

      if (targetPos) {
        destinationMode.current = 'player'
        setIsTransitioning(true)
        setTransitionTarget({
          pos: targetPos,
          rot: targetRot
        })
      } else {
        // No start position, just switch
        setViewMode('player')
      }
    } else {
      // Switch to orbit with animation
      destinationMode.current = 'orbit'

      // Calculate current look target to prevent jumping
      let currentTarget = new THREE.Vector3()

      if (cameraStateRef.current) {
        // Use actual camera rotation from tracker
        const { position, rotation, quaternion } = cameraStateRef.current
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(rotation)
        currentTarget.copy(position).add(direction.multiplyScalar(5))

        // Capture start state for smooth transition
        setTransitionStartState({
          position: position.clone(),
          quaternion: quaternion.clone()
        })
      } else if (playerPositionRef.current) {
        // Fallback to player rotation (yaw only)
        const euler = new THREE.Euler(0, playerRotation, 0, 'YXZ')
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler)
        currentTarget.copy(playerPositionRef.current).add(direction.multiplyScalar(5))
      } else {
        // Fallback
        currentTarget.copy(initialTarget.current)
      }

      // Set orbit target to current view so it doesn't snap
      setOrbitTarget(currentTarget)
      setViewMode('orbit')

      // Animate to default orbit position
      setIsTransitioning(true)
      setTransitionTarget({
        pos: initialCameraPos.current.toArray(),
        lookAt: initialTarget.current.toArray()
      })
    }
  }, [viewMode, player.startPosition, player.startRotation, playerRotation])

  const handleTransitionComplete = useCallback(() => {
    setTransitionTarget(null)
    setTransitionStartState(null)
    setIsTransitioning(false)

    if (destinationMode.current === 'player') {
      setViewMode('player')
    } else if (destinationMode.current === 'orbit') {
      // Ensure final target is correct
      setOrbitTarget(initialTarget.current.clone())
    }
    destinationMode.current = null
  }, [])

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

  useEffect(() => {
    if (projectId && !isPreview) {
      loadProject(projectId)
    }
  }, [projectId, loadProject, isPreview])

  // Check for interaction zone triggers
  const handlePlayerPositionChange = useCallback((position: THREE.Vector3, rotationY: number) => {
    // Update ref immediately for logic that needs current position
    playerPositionRef.current = position

    // Throttle state updates for UI (Minimap rotation, etc.) to 10fps
    const now = Date.now()
    if (now - lastRotationUpdate.current > 100) {
      setPlayerRotation(rotationY)
      // Only update position state if strictly needed for UI that can't use ref
      // setPlayerPosition(position) // Removed to prevent re-renders, MinimapRenderer uses useThree now
      lastRotationUpdate.current = now
    }

    // Check if player is inside any interaction zone
    // Use the raw position argument, not state
    for (const zone of zones) {
      if (dismissedPopupId.current === zone.id) {
        // If we are currently in a dismissed zone, check if we left it
        const zonePos = new THREE.Vector3(...zone.position)
        const distance = position.distanceTo(zonePos)
        if (distance >= zone.radius) {
          // User left the dismissed zone, reset dismissal so it can open again if they return
          dismissedPopupId.current = null
        }
        continue
      }

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

  if (isLoading && !isPreview) {
    return <LoadingScreen message="Proje yükleniyor..." />
  }

  return (
    <div className="w-full h-full relative bg-black">
      {/* 3D Canvas */}
      <div className="canvas-container absolute inset-0">
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
          <FPSCounter />

          {/* Default ambient light */}
          <ambientLight intensity={0.3} />

          {/* Force background color to prevent "Hall of Mirrors" effect when preserveDrawingBuffer is on */}
          {(!environment.showBackground) && <color attach="background" args={['#000000']} />}

          {/* Dynamic Lights from Store */}
          <LightingManager showHelpers={false} />

          {/* Environment */}
          {environment.hdriPreset !== 'custom' ? (
            <Environment
              preset={environment.hdriPreset || 'apartment'}
              background={environment.showBackground && environment.backgroundType !== 'sphere' || false}
              environmentIntensity={environment.intensity ?? 1}
              backgroundBlurriness={environment.backgroundBlurriness ?? 0}
            />
          ) : environment.customHdriUrl ? (
            <>
              <Environment
                files={environment.customHdriUrl}
                background={environment.showBackground && environment.backgroundType !== 'sphere' || false}
                environmentIntensity={environment.intensity ?? 1}
                backgroundBlurriness={environment.backgroundBlurriness ?? 0}
              />
              {/* HDRI Sphere Mode */}
              {environment.backgroundType === 'sphere' && (
                <HdriSphere
                  url={environment.customHdriUrl}
                  position={environment.spherePosition || [0, 0, 0]}
                  scale={environment.sphereScale || 100}
                  rotation={environment.sphereRotation || 0}
                />
              )}
            </>
          ) : (
            <Environment
              preset="apartment"
              background={environment.showBackground || false}
              environmentIntensity={environment.intensity ?? 1}
              backgroundBlurriness={environment.backgroundBlurriness ?? 0}
            />
          )}

          {/* Model */}
          <ModelRenderer />

          {/* Interaction Zones (invisible in viewer/player) */}
          <InteractionZonesManager
            isEditor={false}
            playerPosition={playerPositionRef.current || undefined}
          />

          {/* Hotspot Nodes (Visuals) */}
          <HotspotRenderer isEditor={false} />

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
                target={orbitTarget}
                enabled={!isTransitioning}
                autoRotate={true}
                autoRotateSpeed={0.2}
                mouseButtons={{
                  LEFT: THREE.MOUSE.PAN,
                  MIDDLE: THREE.MOUSE.DOLLY,
                  RIGHT: THREE.MOUSE.ROTATE
                }}
                touches={{
                  ONE: THREE.TOUCH.ROTATE,
                  TWO: THREE.TOUCH.DOLLY_PAN
                }}
              />
              {/* Fly Controls - Left click + WASD */}
              <FlyControls />

              {/* Camera Transition Manager */}
              <CameraTransitionManager
                target={transitionTarget}
                startTarget={viewMode === 'orbit' && destinationMode.current === 'orbit' ? orbitTarget : undefined}
                initialCameraState={transitionStartState}
                onComplete={handleTransitionComplete}
              />
            </>
          )}

          {viewMode === 'player' && (
            <NodeNavigationControls
              enabled={true}
              startPosition={player.startPosition}
              onPositionChange={handlePlayerPositionChange}
            />
          )}

          {/* Minimap Renderer (inside Canvas - renders scene from top) */}
          {viewMode === 'player' && (
            <MinimapRenderer
              viewRange={10}
            />
          )}

          {/* Post-Processing Effects */}
          <EffectsManager />

          {/* Camera Tracker */}
          <CameraTracker onUpdate={(state) => cameraStateRef.current = state} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay absolute inset-0 pointer-events-none">
        {/* Minimal Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
          {/* Left - Project Info */}
          <div className="flex items-center gap-3 bg-[#111618]/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 pointer-events-auto max-w-[calc(100%-200px)] md:max-w-md">
            {onClose ? (
              <button onClick={onClose} className="text-white/60 hover:text-primary transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            ) : (
              <Link to="/" className="text-white/60 hover:text-primary transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
            )}
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

        {/* Controls Info (Desktop Only) */}
        {viewMode === 'orbit' && <ControlsInfo />}

        {/* Bottom Floating Navigation Bar - Referans UI */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-fade-in-up pointer-events-auto">
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

        {/* Configurator Panel - Available in both modes */}
        <div className="pointer-events-auto">
          <ConfiguratorPanel
            isOpen={showConfigurator}
            onToggle={() => setShowConfigurator(!showConfigurator)}
          />
        </div>

        {/* Interaction Popup */}
        {activePopup && viewMode === 'player' && (
          <StyledPopup
            zone={activePopup}
            onClose={() => {
              dismissedPopupId.current = activePopup.id
              setActivePopup(null)
            }}
          />
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
function StyledPopup({ zone, onClose }: { zone: InteractionZone, onClose: () => void }) {
  // Extract style properties
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
    <div className="absolute top-20 left-4 animate-fade-in-up pointer-events-auto">
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
        <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">{zone.popup.title}</h2>

        {/* Render Blocks */}
        <BlockRenderer blocks={zone.popup.blocks || []} />

        {/* Helper text for proximity trigger */}
        <p className="text-center text-[10px] mt-4 opacity-50 border-t border-white/5 pt-2 cursor-pointer hover:opacity-100 transition-opacity" onClick={onClose}>
          Kapatmak için tıklayın
        </p>
      </div>
    </div>
  )
}
