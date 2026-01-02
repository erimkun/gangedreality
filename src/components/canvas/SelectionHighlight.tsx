import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '@/store/useEditorStore'

/**
 * Highlights selected objects with a pulsing outline box
 */
export default function SelectionHighlight() {
  const { selectedObjects, selectedObjectIds } = useEditorStore()
  const boxHelpers = useRef<Map<string, THREE.BoxHelper>>(new Map())
  const groupRef = useRef<THREE.Group>(null)
  const pulsePhase = useRef(0)
  
  // Create/update box helpers for selected objects
  useEffect(() => {
    if (!groupRef.current) return
    
    // Remove helpers for deselected objects
    const currentIds = new Set(selectedObjectIds)
    boxHelpers.current.forEach((helper, id) => {
      if (!currentIds.has(id)) {
        groupRef.current?.remove(helper)
        helper.dispose()
        boxHelpers.current.delete(id)
      }
    })
    
    // Add helpers for newly selected objects
    selectedObjects.forEach((obj, idx) => {
      const id = selectedObjectIds[idx]
      if (!boxHelpers.current.has(id)) {
        const helper = new THREE.BoxHelper(obj, 0x00ff00)
        boxHelpers.current.set(id, helper)
        groupRef.current?.add(helper)
      }
    })
  }, [selectedObjects, selectedObjectIds])
  
  // Update helpers every frame (for moving objects) and animate pulse
  useFrame((_, delta) => {
    pulsePhase.current += delta * 3
    const pulse = Math.sin(pulsePhase.current) * 0.3 + 0.7
    
    boxHelpers.current.forEach((helper, id) => {
      const idx = selectedObjectIds.indexOf(id)
      if (idx >= 0 && selectedObjects[idx]) {
        helper.setFromObject(selectedObjects[idx])
        helper.update()
        
        // Pulse color between green and cyan for multi-select
        if (selectedObjects.length > 1) {
          const color = new THREE.Color().setHSL(0.45 + pulse * 0.1, 1, 0.5)
          ;(helper.material as THREE.LineBasicMaterial).color = color
          ;(helper.material as THREE.LineBasicMaterial).opacity = pulse
        } else {
          ;(helper.material as THREE.LineBasicMaterial).color.setHex(0x00ff00)
          ;(helper.material as THREE.LineBasicMaterial).opacity = 1
        }
      }
    })
  })
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      boxHelpers.current.forEach(helper => helper.dispose())
      boxHelpers.current.clear()
    }
  }, [])
  
  return <group ref={groupRef} name="selection-highlights" />
}
