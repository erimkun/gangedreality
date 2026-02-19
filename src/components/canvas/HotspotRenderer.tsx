import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useHotspotStore, HotspotNode, HotspotSettings, HotspotShape } from '@/store/useHotspotStore'
import { useEditorStore } from '@/store/useEditorStore'

interface HotspotRendererProps {
  isEditor?: boolean
}

// Reusable Ground Cursor Visual (Same as Viewer)
function GroundCursorVisual({ 
  color, 
  opacity = 0.8, 
  scale = 1,
  shape = 'circle',
  customIconUrl
}: { 
  color: string, 
  opacity?: number, 
  scale?: number,
  shape?: HotspotShape,
  customIconUrl?: string
}) {
  const texture = useMemo(() => {
    // If custom icon is provided and shape is 'custom', load it
    if (shape === 'custom' && customIconUrl) {
      const tex = new THREE.TextureLoader().load(customIconUrl)
      // tex.encoding = THREE.sRGBEncoding // Deprecated in newer three.js, handled automatically usually
      return tex
    }

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 128, 128)
      ctx.strokeStyle = 'white'
      ctx.fillStyle = 'white'
      ctx.lineWidth = 8
      const center = 64
      const radius = 50

      switch (shape) {
        case 'ring':
          ctx.beginPath()
          ctx.arc(center, center, radius, 0, Math.PI * 2)
          ctx.stroke()
          break
        case 'double-ring':
          ctx.beginPath()
          ctx.arc(center, center, radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(center, center, radius * 0.6, 0, Math.PI * 2)
          ctx.stroke()
          break
        case 'square':
          ctx.strokeRect(center - radius, center - radius, radius * 2, radius * 2)
          break
        case 'triangle':
          ctx.beginPath()
          ctx.moveTo(center, center - radius)
          ctx.lineTo(center + radius, center + radius)
          ctx.lineTo(center - radius, center + radius)
          ctx.closePath()
          ctx.stroke()
          break
        case 'star':
           ctx.beginPath()
           for(let i = 0; i < 5; i++) {
             ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * radius + center,
                        -Math.sin((18 + i * 72) / 180 * Math.PI) * radius + center)
             ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * radius * 0.5 + center,
                        -Math.sin((54 + i * 72) / 180 * Math.PI) * radius * 0.5 + center)
           }
           ctx.closePath()
           ctx.stroke()
           break
        case 'target':
          ctx.beginPath()
          ctx.arc(center, center, radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(center - radius - 10, center)
          ctx.lineTo(center + radius + 10, center)
          ctx.moveTo(center, center - radius - 10)
          ctx.lineTo(center, center + radius + 10)
          ctx.stroke()
          break
        case 'hexagon':
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            ctx.lineTo(center + radius * Math.cos(i * 2 * Math.PI / 6), center + radius * Math.sin(i * 2 * Math.PI / 6))
          }
          ctx.closePath()
          ctx.stroke()
          break
        case 'diamond':
          ctx.beginPath()
          ctx.moveTo(center, center - radius)
          ctx.lineTo(center + radius, center)
          ctx.lineTo(center, center + radius)
          ctx.lineTo(center - radius, center)
          ctx.closePath()
          ctx.stroke()
          break
        case 'arrow':
          ctx.beginPath()
          ctx.moveTo(center, center - radius)
          ctx.lineTo(center + radius * 0.7, center + radius * 0.5)
          ctx.lineTo(center, center + radius * 0.2)
          ctx.lineTo(center - radius * 0.7, center + radius * 0.5)
          ctx.closePath()
          ctx.fill()
          break
        case 'circle':
        default:
          // Simple ring (default) - User requested empty ring
          ctx.beginPath()
          ctx.arc(center, center, radius, 0, Math.PI * 2)
          ctx.lineWidth = 8
          ctx.stroke()
          break
      }
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [shape, customIconUrl])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[scale, scale, scale]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        color={color} 
        transparent 
        opacity={opacity} 
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function HotspotRenderer({ isEditor = false }: HotspotRendererProps) {
  const { nodes, settings, updateNode, isHotspotMode } = useHotspotStore()
  const { selectObject, selectedObjectId } = useEditorStore()
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const { raycaster, camera, scene, pointer } = useThree()

  // Handle click to add node in Editor mode
  useEffect(() => {
    if (!isEditor || !isHotspotMode) return

    let startX = 0
    let startY = 0

    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX
      startY = e.clientY
    }

    const handleClick = (e: MouseEvent) => {
      // Check if dragged
      const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2))
      if (dist > 5) return // Ignore if moved more than 5 pixels

      // Only handle if not clicking on UI
      if ((e.target as HTMLElement).closest('.ui-overlay') || (e.target as HTMLElement).closest('.editor-ui')) return

      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      // Find valid hit point
      let hitPoint = null
      
      // If walkable meshes are defined, prioritize them
      if (settings.walkableMeshIds && settings.walkableMeshIds.length > 0) {
        for (const hit of intersects) {
          // Check if this object is one of the walkable meshes
          if (settings.walkableMeshIds.includes(hit.object.uuid) || settings.walkableMeshIds.includes(hit.object.name)) {
            hitPoint = hit.point
            break
          }
        }
      } 
      
      // If no specific walkable mesh hit found (or none defined), fallback to first valid mesh
      if (!hitPoint && (!settings.walkableMeshIds || settings.walkableMeshIds.length === 0)) {
        for (const hit of intersects) {
          // Skip if it's a helper or line
          if (!(hit.object as THREE.Mesh).isMesh) continue
          // Skip if it's a hotspot node (sphere/visual)
          if (hit.object.name === 'hotspot-node-visual') continue
          
          hitPoint = hit.point
          break
        }
      }

      if (hitPoint) {
        // Dispatch event for panel to handle
        window.dispatchEvent(new CustomEvent('add-hotspot-node', {
          detail: { position: [hitPoint.x, hitPoint.y, hitPoint.z] }
        }))
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('click', handleClick)
    }
  }, [isEditor, isHotspotMode, raycaster, camera, scene, pointer, settings.walkableMeshIds])

  // Centralized ref map for all hotspot node meshes
  const nodeRefs = useRef<Record<string, THREE.Object3D | null>>({})

  const registerNodeRef = useCallback((nodeId: string, obj: THREE.Object3D | null) => {
    if (obj) {
      nodeRefs.current[nodeId] = obj
    } else {
      delete nodeRefs.current[nodeId]
    }
  }, [])

  // Single useFrame for all hotspot nodes — replaces N per-node useFrames
  useFrame(() => {
    if (!selectedObjectId) return
    const obj = nodeRefs.current[selectedObjectId]
    if (!obj) return
    const node = nodes.find(n => n.id === selectedObjectId)
    if (!node) return
    const { x, y, z } = obj.position
    if (
      Math.abs(x - node.position[0]) > 0.01 ||
      Math.abs(y - node.position[1]) > 0.01 ||
      Math.abs(z - node.position[2]) > 0.01
    ) {
      updateNode(node.id, { position: [x, y, z] })
    }
  })

  return (
    <group>
      {nodes.map((node) => (
        <HotspotNodeMesh
          key={node.id}
          node={node}
          isEditor={isEditor}
          isSelected={selectedObjectId === node.id}
          isHovered={hoveredNode === node.id}
          settings={settings}
          registerRef={registerNodeRef}
          onPointerOver={() => setHoveredNode(node.id)}
          onPointerOut={() => setHoveredNode(null)}
          onSelect={(mesh: THREE.Mesh) => {
            if (isEditor) {
              selectObject(mesh, node.id)
            }
          }}
        />
      ))}
    </group>
  )
}

interface HotspotNodeMeshProps {
  node: HotspotNode
  isEditor: boolean
  isSelected: boolean
  isHovered: boolean
  settings: HotspotSettings
  registerRef: (nodeId: string, obj: THREE.Object3D | null) => void
  onPointerOver: () => void
  onPointerOut: () => void
  onSelect: (mesh: THREE.Mesh) => void
}

function HotspotNodeMesh({ 
  node, 
  isEditor, 
  isSelected, 
  isHovered, 
  settings,
  registerRef,
  onPointerOver,
  onPointerOut,
  onSelect
}: HotspotNodeMeshProps) {
  const { isHotspotMode } = useHotspotStore()
  const meshRef = useRef<THREE.Mesh>(null)

  // Register ref with parent for centralized useFrame sync
  const setGroupRef = useCallback((el: THREE.Group | null) => {
    ;(meshRef as any).current = el
    registerRef(node.id, el)
  }, [node.id, registerRef])

  // Cleanup ref on unmount
  useEffect(() => {
    return () => registerRef(node.id, null)
  }, [node.id, registerRef])

  // Sync position from store to mesh (only if NOT selected, to avoid fighting with Gizmo)
  useEffect(() => {
    if (meshRef.current && !isSelected) {
      meshRef.current.position.set(node.position[0], node.position[1], node.position[2])
    }
  }, [node.position, isSelected])
  
  // Visuals
  const nodeColor = node.color || settings.nodeColor
  const color = isSelected ? '#ff0000' : (isHovered ? settings.nodeHoverColor : nodeColor)
  
  const baseScale = node.size || settings.cursorSize || 1
  const scale = isHovered ? baseScale * 1.2 : baseScale
  
  const shape = node.shape || settings.defaultShape || 'circle'
  const customIconUrl = node.customIconUrl || settings.defaultCustomIconUrl
  
  return (
    <group>
      {/* Editor Visual: Ground Cursor + Label */}
      {isEditor && isHotspotMode && (
        <>
          <group
            ref={setGroupRef}
            name="hotspot-node-visual"
            position={node.position}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              if (meshRef.current) {
                onSelect(meshRef.current)
              }
            }}
            onPointerOver={(e) => { e.stopPropagation(); onPointerOver() }}
            onPointerOut={(e) => { e.stopPropagation(); onPointerOut() }}
          >
            <group position={[0, 0.02, 0]}>
              <GroundCursorVisual 
                color={color} 
                scale={scale} 
                opacity={settings.cursorOpacity}
                shape={shape}
                customIconUrl={customIconUrl}
              />
            </group>
          </group>
          
          <Html position={[node.position[0], node.position[1] + 0.5, node.position[2]]} center distanceFactor={10}>
            <div className={`px-2 py-1 rounded text-xs whitespace-nowrap ${isSelected ? 'bg-red-500 text-white' : 'bg-black/50 text-white'} pointer-events-none select-none`}>
              {node.label || 'Node'}
            </div>
          </Html>
        </>
      )}

      {/* Viewer Visual: Ground Ring (Always visible to show where you can go) */}
      {!isEditor && node.visible && (
        <group position={[node.position[0], node.position[1] + 0.02, node.position[2]]}>
          <GroundCursorVisual 
            color={nodeColor} 
            scale={baseScale} 
            opacity={settings.cursorOpacity || 0.5}
            shape={shape}
            customIconUrl={customIconUrl}
          />
        </group>
      )}
    </group>
  )
}
