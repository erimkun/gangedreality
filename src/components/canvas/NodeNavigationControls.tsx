import { useState, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useHotspotStore } from '@/store/useHotspotStore'
import { useNavigationStore } from '@/store/useNavigationStore'
import GroundCursor from './GroundCursor'
import gsap from 'gsap'

interface NodeNavigationControlsProps {
  enabled: boolean
  startPosition?: [number, number, number]
  onPositionChange?: (pos: THREE.Vector3, rot: number) => void
}

export default function NodeNavigationControls({ enabled, startPosition, onPositionChange }: NodeNavigationControlsProps) {
  const { camera, raycaster, pointer, scene, gl } = useThree()
  const { nodes, settings } = useHotspotStore()
  const setIsNavigating = useNavigationStore(state => state.setIsNavigating)
  const cursorPositionRef = useRef(new THREE.Vector3(0, 0, 0))
  const [isCursorVisible, setIsCursorVisible] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  // Drag to look state
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const wasDrag = useRef(false)

  // Fixed eye height
  const EYE_HEIGHT = 1.7

  // Initial setup
  useEffect(() => {
    if (enabled && startPosition) {
      // User sets the exact camera position for start in editor, so use it directly
      camera.position.set(startPosition[0], startPosition[1], startPosition[2])

      // IMPORTANT: Before changing rotation order, extract the current look direction
      // and recalculate proper YXZ euler angles without roll
      const currentQuat = camera.quaternion.clone()
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(currentQuat)

      // Calculate yaw (Y rotation) and pitch (X rotation) from direction
      const yaw = Math.atan2(-direction.x, -direction.z)
      const pitch = Math.asin(Math.max(-1, Math.min(1, direction.y))) // Clamp for safety

      // Now set rotation order and apply clean YXZ rotation (no roll)
      camera.rotation.order = 'YXZ'
      camera.rotation.set(pitch, yaw, 0) // pitch, yaw, roll=0

      // Initial update
      if (onPositionChange) {
        onPositionChange(camera.position.clone(), camera.rotation.y)
      }
    }

    // Cleanup navigation state and GSAP tweens on unmount
    return () => {
      setIsNavigating(false)
      gsap.killTweensOf(camera.position)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, startPosition, camera]) // Removed onPositionChange to prevent reset loop

  // Update position callback on every frame if moving or looking
  useFrame(() => {
    if (enabled && onPositionChange) {
      onPositionChange(camera.position.clone(), camera.rotation.y)
    }
  })

  // Handle Mouse Events for Look and Click
  useEffect(() => {
    if (!enabled) return

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return // Only left click
      isDragging.current = true
      dragStart.current = { x: e.clientX, y: e.clientY }
      wasDrag.current = false
      gl.domElement.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return

      const deltaX = e.clientX - dragStart.current.x
      const deltaY = e.clientY - dragStart.current.y

      // If moved more than a few pixels, consider it a drag
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        wasDrag.current = true
      }

      if (wasDrag.current) {
        const sensitivity = 0.002
        camera.rotation.y -= deltaX * sensitivity
        camera.rotation.x -= deltaY * sensitivity
        // Clamp pitch
        camera.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, camera.rotation.x))

        dragStart.current = { x: e.clientX, y: e.clientY }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return
      isDragging.current = false
      gl.domElement.releasePointerCapture(e.pointerId)

      if (!wasDrag.current && !isMoving) {
        // It was a click, handle movement
        handleClick()
      }
    }

    const element = gl.domElement
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)

    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerUp)
    }
  }, [enabled, isMoving, isCursorVisible, camera, gl])

  // Raycast loop for cursor
  useFrame(() => {
    if (!enabled || isMoving || isDragging.current) {
      if (isCursorVisible) setIsCursorVisible(false)
      return
    }

    // Raycast to ground
    raycaster.setFromCamera(pointer, camera)

    // Intersect with everything, filter for ground-like objects (up facing normal)
    const intersects = raycaster.intersectObjects(scene.children, true)

    let groundPoint: THREE.Vector3 | null = null

    for (const hit of intersects) {
      // Check if mesh is walkable (if list is defined)
      const mesh = hit.object as THREE.Mesh
      const meshName = mesh.name || mesh.uuid

      // If walkableMeshIds is set and not empty, only allow those meshes
      if (settings.walkableMeshIds && settings.walkableMeshIds.length > 0) {
        if (!settings.walkableMeshIds.includes(meshName)) {
          continue
        }
      }

      // Simple check: if normal is roughly up (y > 0.5) and it's a mesh
      if (hit.face && hit.face.normal.y > 0.5) {
        groundPoint = hit.point
        break
      }
    }

    if (groundPoint) {
      cursorPositionRef.current.copy(groundPoint)
      setIsCursorVisible(true)
    } else {
      setIsCursorVisible(false)
    }
  })

  const handleClick = () => {
    // Find nearest node to cursor
    let nearestNode = null
    let minDistance = Infinity

    for (const node of nodes) {
      const nodePos = new THREE.Vector3(...node.position)
      // Ignore Y for distance check (2D distance)
      const dist = Math.sqrt(
        Math.pow(nodePos.x - cursorPositionRef.current.x, 2) +
        Math.pow(nodePos.z - cursorPositionRef.current.z, 2)
      )

      if (dist < minDistance) {
        minDistance = dist
        nearestNode = node
      }
    }

    if (nearestNode) {
      moveToNode(nearestNode.position)
    }
  }

  const moveToNode = (targetPos: [number, number, number]) => {
    setIsMoving(true)
    setIsCursorVisible(false)
    setIsNavigating(true) // Motion blur için global state

    // Target height is node floor position + eye height
    const targetVec = new THREE.Vector3(targetPos[0], targetPos[1] + EYE_HEIGHT, targetPos[2])

    // Animate camera position
    gsap.to(camera.position, {
      x: targetVec.x,
      y: targetVec.y,
      z: targetVec.z,
      duration: settings.animationDuration,
      ease: 'power2.inOut',
      onComplete: () => {
        setIsMoving(false)
        setIsNavigating(false) // Motion blur'u kapat
      }
    })
  }

  return (
    <>
      <GroundCursor position={cursorPositionRef.current} visible={isCursorVisible && !isMoving && !isDragging.current} />
    </>
  )
}
