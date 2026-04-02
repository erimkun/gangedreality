import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, GizmoHelper, GizmoViewport, Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '@/store/useProjectStore'
import { useSceneStore } from '@/store/useSceneStore'
import { useEditorStore } from '@/store/useEditorStore'
import { useHistoryStore, useUndoRedoKeyboard } from '@/hooks/useHistory'
import ModelRenderer from '@/components/canvas/ModelRenderer'
import EditorControls from '@/components/canvas/EditorControls'
import SelectionHighlight from '@/components/canvas/SelectionHighlight'
import CameraController from '@/components/canvas/CameraController'
import LightingManager from '@/components/canvas/LightingManager'
import InteractionZonesManager from '@/components/canvas/InteractionZone'
import LoadingScreen from '@/components/ui/LoadingScreen'
import EditorPanel from '@/components/ui/EditorPanel'
import NewProjectDialog from '@/components/ui/NewProjectDialog'
import ModelDropZone from '@/components/ui/ModelDropZone'
import LeftPanel from '@/components/ui/LeftPanel'
import { FlyControls, FlySpeedIndicator } from '@/components/canvas/FlyControls'
import EffectsManager from '@/components/canvas/EffectsManager'
import ViewerPreviewModal from '@/components/ui/ViewerPreviewModal'
import { exportProjectAsZip } from '@/utils/zipExporter'
import { toast } from '@/store/useToastStore'
import HotspotRenderer from '@/components/canvas/HotspotRenderer'
import HdriSphere from '@/components/canvas/HdriSphere'
import { FPSCounter } from '@/components/ui/FPSCounter'
import ServerAuthModal from '@/components/ui/ServerAuthModal'
import { isAuthenticated, saveProject as apiSaveProject, uploadAsset } from '@/services/api'
import type { MeshMaterialOverride } from '@/types'

// Editor Camera Initializer - Sets camera to saved orbit position on load
function EditorCameraInitializer() {
  const { camera: cameraConfig } = useSceneStore()
  const { camera, controls } = useThree()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && controls && cameraConfig) {
      // Set camera position from store
      camera.position.set(...cameraConfig.position)

      // Set orbit target
      const orbitControls = controls as any
      if (orbitControls.target) {
        orbitControls.target.set(...cameraConfig.target)
        orbitControls.update()
      }

      initialized.current = true
    }
  }, [camera, controls, cameraConfig])

  return null
}

import { useHotspotStore } from '@/store/useHotspotStore'

// Player Start Position Marker
function PlayerStartMarker() {
  const { player, updatePlayer, updateCamera } = useSceneStore()
  const { camera, controls } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const { isHotspotMode } = useHotspotStore()

  // Listen for "set from camera" event
  useEffect(() => {
    const handleSetFromCamera = () => {
      const pos = camera.position.clone()
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion)

      updatePlayer({
        startPosition: [pos.x, pos.y, pos.z],
        startRotation: [euler.x, euler.y, euler.z]
      })

      // Show toast via custom event
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Oyuncu başlangıç noktası güncellendi', type: 'success' }
      }))
    }

    // Listen for orbit camera set event
    const handleSetOrbitCamera = () => {
      const pos = camera.position.clone()
      const target = controls ? (controls as any).target.clone() : new THREE.Vector3(0, 0, 0)

      updateCamera({
        position: [pos.x, pos.y, pos.z],
        target: [target.x, target.y, target.z]
      })

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Orbit kamera ayarları kaydedildi', type: 'success' }
      }))
    }

    window.addEventListener('set-player-start-from-camera', handleSetFromCamera)
    window.addEventListener('set-orbit-camera-from-current', handleSetOrbitCamera)
    return () => {
      window.removeEventListener('set-player-start-from-camera', handleSetFromCamera)
      window.removeEventListener('set-orbit-camera-from-current', handleSetOrbitCamera)
    }
  }, [camera, controls, updatePlayer, updateCamera])

  // Animate the marker
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  if (isHotspotMode) return null

  const pos = player.startPosition
  const rot = player.startRotation

  // Calculate forward direction from rotation
  const forward = new THREE.Vector3(0, 0, -1)
  forward.applyEuler(new THREE.Euler(rot[0], rot[1], rot[2]))

  return (
    <group position={[pos[0], pos[1], pos[2]]}>
      {/* Main sphere */}
      <Sphere ref={meshRef} args={[0.3, 16, 16]}>
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} transparent opacity={0.8} />
      </Sphere>

      {/* Direction arrow */}
      <arrowHelper
        args={[forward, new THREE.Vector3(0, 0, 0), 1, 0x22c55e, 0.2, 0.15]}
      />

      {/* Ring around */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Label */}
      <Html position={[0, 0.8, 0]} center>
        <div className="bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap font-medium shadow-lg">
          🚶 Başlangıç
        </div>
      </Html>
    </group>
  )
}

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { loadProject, isLoading, createNewProject, projectName, getFullProjectData } = useProjectStore()
  const { environment } = useSceneStore()
  useEditorStore() // Initialize editor store
  useUndoRedoKeyboard() // Enable Ctrl+Z / Ctrl+Y

  const { canUndo, canRedo, undo, redo } = useHistoryStore()
  const activeTool = useEditorStore((s) => s.activeTool)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const isGizmoActive = useEditorStore((s) => s.isGizmoActive)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showModelUpload, setShowModelUpload] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showSimulation, setShowSimulation] = useState(false)
  const [isSavingToServer, setIsSavingToServer] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (projectId) {
      loadProject(projectId).then((exists) => {
        if (!cancelled && !exists) {
          setShowNewProjectDialog(true)
        }
      })
    }
    return () => { cancelled = true }
  }, [projectId, loadProject])

  const handleCreateNewProject = (name: string) => {
    if (projectId) {
      createNewProject(projectId, name)
      setShowNewProjectDialog(false)
      // Show model upload after creating project
      setShowModelUpload(true)
    }
  }

  // Keyboard shortcuts for Transform Tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Ctrl+S = Prevent default (no save anymore)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        return
      }

      // Transform tool shortcuts (W/G, E, R/S)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'w': // W = Translate
          case 'g': // G = Grab (Translate)
            setActiveTool('translate')
            break
          case 'e': // E = Rotate
            setActiveTool('rotate')
            break
          case 'r': // R = Scale
          case 's': // S = Scale (only if not Ctrl+S)
            setActiveTool('scale')
            break
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActiveTool])

  const handleExportZip = useCallback(async () => {
    setIsExporting(true)
    try {
      const projectData = getFullProjectData()
      await exportProjectAsZip(projectData)
      toast.success('Proje başarıyla dışa aktarıldı!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Dışa aktarma başarısız oldu')
    }
    setIsExporting(false)
  }, [getFullProjectData])

  const doSaveToServer = useCallback(async () => {
    if (!projectId) return
    setIsSavingToServer(true)
    try {
      // Deep clone to avoid mutating live store state
      const data = JSON.parse(JSON.stringify(getFullProjectData()))

      const win = window as any

      // Helper: strip blob/absolute URLs back to relative paths
      const resolveUrl = (url?: string | null): string | undefined | null => {
        if (!url) return url
        // blob URL → check __blobUrlToFileName / __dataUrlToFileName maps
        if (url.startsWith('blob:') || url.startsWith('data:')) {
          if (win.__blobUrlToFileName?.has(url)) return win.__blobUrlToFileName.get(url)
          if (win.__dataUrlToFileName?.has(url)) return win.__dataUrlToFileName.get(url)
        }
        // Absolute /data/projectId/... → strip to relative
        const prefix = `/data/${projectId}/`
        if (url.startsWith(prefix)) return url.slice(prefix.length)
        return url
      }

      // Upload model files that are blobs
      const modelFileMap = new Map<string, string>() // blobUrl → relative path
      if (win.__loadedModelFiles?.length) {
        for (const file of win.__loadedModelFiles) {
          try {
            const relativePath = await uploadAsset(projectId, file, 'model')
            // Map all blob URLs for this filename
            modelFileMap.set(file.name, relativePath) // "model/scene.glb"
          } catch (e) {
            console.warn('Model upload skipped:', e)
          }
        }
      }

      // Upload texture files that are blobs
      if (win.__loadedTextures?.size) {
        for (const [filename, file] of win.__loadedTextures) {
          if (file instanceof File || file instanceof Blob) {
            try {
              await uploadAsset(projectId, file instanceof File ? file : new File([file], filename), 'textures')
            } catch (e) {
              console.warn('Texture upload skipped:', e)
            }
          }
        }
      }

      // Upload interaction image blobs
      if (win.__interactionFiles?.size && data.interactions?.zones) {
        for (const zone of data.interactions.zones) {
          if (zone.popup?.blocks) {
            for (const block of zone.popup.blocks) {
              if (block.type === 'image' && block.content?.startsWith('blob:') && win.__interactionFiles.has(block.content)) {
                const file = win.__interactionFiles.get(block.content)
                if (file) {
                  try {
                    const safeFileName = `int_${zone.id}_${block.id}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                    await uploadAsset(projectId, new File([file], safeFileName), 'textures')
                    block.content = `textures/${safeFileName}`
                  } catch (e) {
                    console.warn('Interaction image upload skipped:', e)
                  }
                }
              }
            }
          }
        }
      }

      // --- Replace blob/absolute URLs with relative paths in project data ---

      // Models
      if (data.project.assets.mainModel) {
        const resolved = resolveUrl(data.project.assets.mainModel)
        if (resolved?.startsWith('blob:') && win.__loadedModelFiles?.length) {
          // Blob URL not in map — use the filename
          data.project.assets.mainModel = `model/${win.__loadedModelFiles[0].name}`
        } else {
          data.project.assets.mainModel = resolved
        }
      }
      if (data.project.assets.models?.length) {
        let fileIdx = 0
        for (const model of data.project.assets.models) {
          if (model.url) {
            const resolved = resolveUrl(model.url)
            if (resolved?.startsWith('blob:') && win.__loadedModelFiles?.[fileIdx]) {
              model.url = `model/${win.__loadedModelFiles[fileIdx].name}`
              fileIdx++
            } else {
              model.url = resolved
            }
          }

          if (model.meshMaterialOverrides) {
            Object.values(model.meshMaterialOverrides as Record<string, MeshMaterialOverride>).forEach((override) => {
              override.textureUrl = resolveUrl(override.textureUrl)
              override.normalMapUrl = resolveUrl(override.normalMapUrl)
              override.roughnessMapUrl = resolveUrl(override.roughnessMapUrl)
            })
          }
        }
      }

      // Scene HDRI
      if (data.scene?.environment?.customHdriUrl) {
        data.scene.environment.customHdriUrl = resolveUrl(data.scene.environment.customHdriUrl)
      }

      // Variants textures
      if (data.variants?.configurableGroups) {
        for (const group of data.variants.configurableGroups) {
          if (group.options) {
            for (const opt of group.options) {
              opt.textureUrl = resolveUrl(opt.textureUrl)
              opt.normalMapUrl = resolveUrl(opt.normalMapUrl)
              opt.roughnessMapUrl = resolveUrl(opt.roughnessMapUrl)
            }
          }
        }
      }

      // Hotspot icons
      if (data.hotspots?.nodes) {
        for (const node of data.hotspots.nodes) {
          node.customIconUrl = resolveUrl(node.customIconUrl)
        }
      }
      if (data.hotspots?.settings?.defaultCustomIconUrl) {
        data.hotspots.settings.defaultCustomIconUrl = resolveUrl(data.hotspots.settings.defaultCustomIconUrl)
      }

      await apiSaveProject(projectId, {
        project: data.project,
        scene: data.scene,
        interactions: data.interactions,
        variants: data.variants,
        hotspots: data.hotspots,
      })

      toast.success('Proje sunucuya kaydedildi!')
    } catch (error: any) {
      console.error('Server save failed:', error)
      if (error.message === 'AUTH_REQUIRED') {
        setShowAuthModal(true)
        setPendingSave(true)
      } else {
        toast.error('Sunucuya kaydetme başarısız: ' + (error.message || ''))
      }
    } finally {
      setIsSavingToServer(false)
    }
  }, [projectId, getFullProjectData])

  const handleSaveToServer = useCallback(() => {
    if (!isAuthenticated()) {
      setShowAuthModal(true)
      setPendingSave(true)
      return
    }
    doSaveToServer()
  }, [doSaveToServer])

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false)
    if (pendingSave) {
      setPendingSave(false)
      doSaveToServer()
    }
  }, [pendingSave, doSaveToServer])

  const handleModelLoaded = useCallback(() => {
    setShowModelUpload(false)
  }, [])

  if (isLoading) {
    return <LoadingScreen message="Editör yükleniyor..." />
  }

  if (showNewProjectDialog) {
    return (
      <NewProjectDialog
        projectId={projectId || 'new'}
        onConfirm={handleCreateNewProject}
        onCancel={() => window.history.back()}
      />
    )
  }

  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas */}
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{ position: [5, 5, 5], fov: 50, near: 0.001, far: 2000 }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: false
          }}
          dpr={[1, 2]}
        >
          <FPSCounter />

          {/* Default Lighting */}
          <ambientLight intensity={0.3} />

          {/* Force background color to prevent "Hall of Mirrors" effect when preserveDrawingBuffer is on */}
          {(!environment.showBackground) && <color attach="background" args={['#000000']} />}

          {/* Dynamic Lights from Store */}
          <LightingManager isEditor />

          {/* Interaction Zones */}
          <InteractionZonesManager isEditor />

          {/* Hotspot Nodes */}
          <HotspotRenderer isEditor />

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

          {/* Model with Editor Support */}
          <ModelRenderer isEditor />

          {/* Selection Highlight for Multi-Select */}
          <SelectionHighlight />

          {/* Editor Transform Controls */}
          <EditorControls />

          {/* Camera Controller for Focus */}
          <CameraController />

          {/* Editor Fly Controls - Left-click + WASD */}
          <FlyControls />

          {/* Controls */}
          <OrbitControls
            makeDefault
            enabled={!isGizmoActive}
            enableDamping
            dampingFactor={0.05}
            minDistance={0.5}
            maxDistance={200}
            mouseButtons={{
              LEFT: undefined as unknown as THREE.MOUSE, // Disable Left Click (Reserved for Selection/Fly)
              MIDDLE: THREE.MOUSE.PAN, // Middle Click to Pan
              RIGHT: THREE.MOUSE.ROTATE // Right Click to Rotate
            }}
          />

          {/* Initialize camera position from saved orbit camera settings */}
          <EditorCameraInitializer />

          {/* Gizmo Helper */}
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ff4d4d', '#4dff4d', '#4d4dff']} labelColor="white" />
          </GizmoHelper>

          {/* Player Start Marker */}
          <PlayerStartMarker />

          {/* Ground Grid */}
          <gridHelper args={[20, 20, '#444', '#333']} />

          {/* Post-Processing Effects */}
          <EffectsManager />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* Profesyonel Header Bar */}
        <div className="absolute top-0 left-0 right-0 bg-[#111618]/95 backdrop-blur-xl border-b border-white/5">
          {/* Ana Header */}
          <div className="flex items-center justify-between px-4 py-2">
            {/* Sol - Logo ve Proje */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm">Ana Sayfa</span>
              </Link>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-3">
                <span className="size-8 flex items-center justify-center bg-primary/20 text-primary rounded-lg text-sm">
                  📐
                </span>
                <div>
                  <h1 className="text-white text-sm font-medium">{projectName || projectId}</h1>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">
                    3D Editör
                  </p>
                </div>
              </div>
            </div>

            {/* Orta - Ana Araçlar */}
            <div className="flex items-center gap-1 bg-editor-bg/50 rounded-full p-1 border border-white/5">
              {/* Undo/Redo */}
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`size-9 flex items-center justify-center rounded-full transition-colors ${canUndo ? 'text-white/80 hover:bg-white/10' : 'text-white/20 cursor-not-allowed'
                  }`}
                title="Geri Al (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`size-9 flex items-center justify-center rounded-full transition-colors ${canRedo ? 'text-white/80 hover:bg-white/10' : 'text-white/20 cursor-not-allowed'
                  }`}
                title="İleri Al (Ctrl+Y)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Transform Araçları */}
              <button
                onClick={() => setActiveTool('translate')}
                className={`size-9 flex items-center justify-center rounded-full transition-all ${activeTool === 'translate'
                  ? 'bg-primary text-editor-bg shadow-lg shadow-primary/30'
                  : 'text-white/80 hover:bg-white/10'
                  }`}
                title="Taşı (W)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V7a5 5 0 0110 0v4M5 20h14l1-8H4l1 8z" />
                </svg>
              </button>
              <button
                onClick={() => setActiveTool('rotate')}
                className={`size-9 flex items-center justify-center rounded-full transition-all ${activeTool === 'rotate'
                  ? 'bg-primary text-editor-bg shadow-lg shadow-primary/30'
                  : 'text-white/80 hover:bg-white/10'
                  }`}
                title="Döndür (E)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setActiveTool('scale')}
                className={`size-9 flex items-center justify-center rounded-full transition-all ${activeTool === 'scale'
                  ? 'bg-primary text-editor-bg shadow-lg shadow-primary/30'
                  : 'text-white/80 hover:bg-white/10'
                  }`}
                title="Ölçekle (R)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>

            {/* Sağ - Aksiyonlar */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToServer}
                disabled={isSavingToServer}
                className="flex items-center gap-2 px-3 py-2 bg-cyan-600/80 border border-cyan-400/30 text-white hover:bg-cyan-500/80 rounded-lg transition-all text-sm font-medium shadow-lg shadow-cyan-500/10"
              >
                {isSavingToServer ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
                <span className="hidden md:inline">Sunucuya Kaydet</span>
              </button>

              <button
                onClick={handleExportZip}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-editor-bg/50 border border-white/10 text-white/80 hover:text-white hover:border-primary/30 rounded-lg transition-all text-sm"
              >
                {isExporting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                <span className="hidden md:inline">Dışa Aktar</span>
              </button>

              <Link
                to={`/${projectId}`}
                className="flex items-center gap-2 px-3 py-2 bg-primary/90 hover:bg-primary text-editor-bg rounded-lg transition-all text-sm font-medium shadow-lg shadow-primary/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden md:inline">Önizle</span>
              </Link>

              <button
                onClick={() => setShowSimulation(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-purple-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="hidden md:inline">Simülasyon</span>
              </button>
            </div>
          </div>
        </div>

        {/* Left Panel - Outliner + Add Tools */}
        <LeftPanel onModelUpload={() => setShowModelUpload(true)} />

        {/* Right Panel - Properties */}
        <EditorPanel />

        {/* Fly Speed Indicator */}
        <FlySpeedIndicator />

        {/* Model Upload Overlay */}
        {showModelUpload && (
          <ModelDropZone onModelLoaded={handleModelLoaded} />
        )}

        {/* Live Simulation Modal */}
        {showSimulation && (
          <ViewerPreviewModal onClose={() => setShowSimulation(false)} />
        )}

        {/* Server Auth Modal */}
        {showAuthModal && (
          <ServerAuthModal
            onSuccess={handleAuthSuccess}
            onCancel={() => { setShowAuthModal(false); setPendingSave(false) }}
          />
        )}
      </div>
    </div>
  )
}
