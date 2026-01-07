import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useHotspotStore } from '@/store/useHotspotStore'

interface GroundCursorProps {
  position: THREE.Vector3
  visible: boolean
}

export default function GroundCursor({ position, visible }: GroundCursorProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { settings } = useHotspotStore()

  // Create a ring texture programmatically
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 128, 128)
      
      // Outer ring
      ctx.beginPath()
      ctx.arc(64, 64, 50, 0, Math.PI * 2)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 8
      ctx.stroke()
      
      // Inner dot (optional, maybe for center)
      // ctx.beginPath()
      // ctx.arc(64, 64, 10, 0, Math.PI * 2)
      // ctx.fillStyle = 'white'
      // ctx.fill()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    
    // Smooth follow
    meshRef.current.position.lerp(position, 0.2)
    
    // Pulse effect
    const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05
    meshRef.current.scale.set(scale, scale, scale)
    
    // Rotate slowly
    meshRef.current.rotation.z += 0.01
  })

  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      visible={visible}
      position={position}
    >
      <planeGeometry args={[settings.cursorSize / 3, settings.cursorSize / 3]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={settings.cursorOpacity} 
        color={settings.cursorColor}
        depthTest={false} // Always show on top of ground slightly
        depthWrite={false}
      />
    </mesh>
  )
}
