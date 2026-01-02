import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useEditorStore } from '@/store/useEditorStore'
import * as THREE from 'three'

/**
 * CameraController handles camera focus transitions
 * When F is pressed on a selected object, camera smoothly moves to focus on it
 */
export default function CameraController() {
  const { controls } = useThree()
  const { focusTarget, setFocusTarget } = useEditorStore()
  
  const isAnimating = useRef(false)
  const targetPosition = useRef(new THREE.Vector3())
  const startPosition = useRef(new THREE.Vector3())
  const animationProgress = useRef(0)
  
  // Start animation when focusTarget changes
  useEffect(() => {
    if (focusTarget && controls) {
      isAnimating.current = true
      animationProgress.current = 0
      
      // Get current camera target (orbit center)
      const orbitControls = controls as any
      if (orbitControls.target) {
        startPosition.current.copy(orbitControls.target)
      }
      targetPosition.current.copy(focusTarget)
      
      // Clear focus target after starting animation
      setTimeout(() => setFocusTarget(null), 100)
    }
  }, [focusTarget, controls, setFocusTarget])
  
  // Animate camera to focus target
  useFrame((_, delta) => {
    if (!isAnimating.current || !controls) return
    
    animationProgress.current += delta * 3 // Speed of animation
    
    if (animationProgress.current >= 1) {
      animationProgress.current = 1
      isAnimating.current = false
    }
    
    // Smooth easing
    const t = easeOutCubic(animationProgress.current)
    
    // Interpolate orbit target
    const orbitControls = controls as any
    if (orbitControls.target) {
      orbitControls.target.lerpVectors(startPosition.current, targetPosition.current, t)
      orbitControls.update()
    }
  })
  
  return null
}

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
