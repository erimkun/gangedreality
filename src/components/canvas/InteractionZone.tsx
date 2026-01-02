import { useRef, useMemo, useEffect } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useInteractionsStore } from '@/store/useInteractionsStore'
import { useEditorStore } from '@/store/useEditorStore'

interface InteractionZoneProps {
  zoneId: string
  position: [number, number, number]
  radius: number
  title: string
  isEditor?: boolean
  onTrigger?: () => void
}

function InteractionZoneMesh({ 
  zoneId, 
  position, 
  radius, 
  title,
  isEditor = false, 
  onTrigger: _onTrigger
}: InteractionZoneProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { selectObject, registerMesh, unregisterMesh } = useEditorStore()
  const { setActiveZone, activeZoneId } = useInteractionsStore()
  
  const isActive = activeZoneId === zoneId

  // Register/unregister zone in sceneMeshes for outliner
  useEffect(() => {
    if (!isEditor || !meshRef.current) return
    
    registerMesh({
      id: zoneId,
      name: `Zone: ${title}`,
      object: meshRef.current,
      visible: true,
      type: 'zone'
    })
    
    return () => {
      unregisterMesh(zoneId)
    }
  }, [isEditor, zoneId, title, registerMesh, unregisterMesh])
  
  // Create material
  const material = useMemo(() => {
    if (isEditor) {
      return new THREE.MeshBasicMaterial({
        color: isActive ? '#00ff00' : '#3b82f6',
        transparent: true,
        opacity: isActive ? 0.4 : 0.25,
        wireframe: false,
        side: THREE.DoubleSide
      })
    }
    // In viewer/player mode, zones are invisible
    return new THREE.MeshBasicMaterial({
      visible: false
    })
  }, [isEditor, isActive])
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isEditor) return
    e.stopPropagation()
    
    if (meshRef.current) {
      selectObject(meshRef.current, zoneId, `Zone: ${zoneId}`)
      setActiveZone(zoneId)
    }
  }
  
  return (
    <group position={position}>
      {/* Zone sphere */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        material={material}
      >
        <sphereGeometry args={[radius, 24, 24]} />
      </mesh>
      
      {/* Wireframe outline */}
      {isEditor && (
        <mesh>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial 
            color={isActive ? '#00ff00' : '#3b82f6'} 
            wireframe 
            transparent 
            opacity={0.6} 
          />
        </mesh>
      )}
      
      {/* Center marker */}
      {isEditor && (
        <mesh>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color={isActive ? '#00ff00' : '#f59e0b'} />
        </mesh>
      )}
      
      {/* Label */}
      {isEditor && (
        <Html
          position={[0, radius + 0.3, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
            isActive 
              ? 'bg-green-500 text-white' 
              : 'bg-blue-500/80 text-white'
          }`}>
            📍 {title}
          </div>
        </Html>
      )}
    </group>
  )
}

interface InteractionZonesManagerProps {
  isEditor?: boolean
  playerPosition?: THREE.Vector3
}

export default function InteractionZonesManager({ 
  isEditor = false,
  playerPosition: _playerPosition
}: InteractionZonesManagerProps) {
  const { zones } = useInteractionsStore()
  
  // Debug: console.log('[InteractionZonesManager] Rendering zones:', zones.length)
  
  return (
    <group name="interaction-zones">
      {zones.map(zone => (
        <InteractionZoneMesh
          key={zone.id}
          zoneId={zone.id}
          position={zone.position}
          radius={zone.radius}
          title={zone.popup.title}
          isEditor={isEditor}
        />
      ))}
    </group>
  )
}
