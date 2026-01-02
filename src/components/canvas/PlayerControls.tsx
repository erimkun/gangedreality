import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/store/useSceneStore'
import { SimpleOctree, Capsule } from '@/utils/Octree'

// Debug logger
const DEBUG = false
const log = (message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[PlayerControls]`, message, data !== undefined ? data : '')
  }
}

// Player capsule dimensions
const PLAYER_HEIGHT = 1.7  // Total height
const PLAYER_RADIUS = 0.3 // Capsule radius (smaller to avoid getting stuck)
const PLAYER_CAPSULE_OFFSET = 0.15 // Offset from ground

interface PlayerControlsProps {
  enabled?: boolean
  onPositionChange?: (position: THREE.Vector3, rotationY: number) => void
  collisionMeshes?: THREE.Object3D[] // Meshes to collide with
  mobileInput?: { move: { x: number, y: number }, look: { x: number, y: number } }
}

export default function PlayerControls({ 
  enabled = true,
  onPositionChange,
  collisionMeshes = [],
  mobileInput
}: PlayerControlsProps) {
  const { camera, gl } = useThree()
  const { player } = useSceneStore()
  
  // Movement state
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,   // Jump/fly up
    down: false  // Crouch/fly down
  })
  
  // Mouse look state
  const mouseState = useRef({
    isLocked: false,
    euler: new THREE.Euler(0, 0, 0, 'YXZ'),
    PI_2: Math.PI / 2
  })
  
  // Velocity for smooth movement
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  
  // Player position (separate from camera for collision later)
  const playerPosition = useRef(new THREE.Vector3())
  
  // Player capsule for collision
  const playerCapsule = useRef(new Capsule(
    new THREE.Vector3(0, PLAYER_CAPSULE_OFFSET, 0),
    new THREE.Vector3(0, PLAYER_HEIGHT - PLAYER_RADIUS, 0),
    PLAYER_RADIUS
  ))
  
  // Octree for collision detection
  const octree = useRef<SimpleOctree | null>(null)
  
  // Build octree from collision meshes
  useEffect(() => {
    if (collisionMeshes.length === 0) {
      octree.current = null
      return
    }
    
    // Create new octree
    const newOctree = new SimpleOctree()
    
    // Add all meshes to octree
    collisionMeshes.forEach(object => {
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          newOctree.fromMesh(mesh)
        }
      })
    })
    
    octree.current = newOctree
    log('Octree built with meshes:', collisionMeshes.length)
  }, [collisionMeshes])
  
  // Initialize player position from store
  useEffect(() => {
    if (enabled && player.startPosition) {
      const [x, y, z] = player.startPosition
      playerPosition.current.set(x, y, z)
      camera.position.set(x, y, z)
      
      // Set initial rotation if provided
      if (player.startRotation) {
        const [rx, ry, rz] = player.startRotation
        mouseState.current.euler.set(rx, ry, rz, 'YXZ')
        camera.quaternion.setFromEuler(mouseState.current.euler)
      }
      
      log('Player initialized at', { x, y, z })
    }
  }, [enabled, player.startPosition, player.startRotation, camera])
  
  // Pointer lock handlers
  const requestPointerLock = useCallback(() => {
    if (!enabled) return
    gl.domElement.requestPointerLock()
  }, [enabled, gl])
  
  const handlePointerLockChange = useCallback(() => {
    mouseState.current.isLocked = document.pointerLockElement === gl.domElement
    log('Pointer lock:', mouseState.current.isLocked)
  }, [gl])
  
  const handlePointerLockError = useCallback(() => {
    console.error('Pointer lock error')
  }, [])
  
  // Mouse movement handler
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!mouseState.current.isLocked || !enabled) return
    
    const movementX = event.movementX || 0
    const movementY = event.movementY || 0
    
    // Sensitivity
    const sensitivity = 0.002
    
    mouseState.current.euler.setFromQuaternion(camera.quaternion)
    mouseState.current.euler.y -= movementX * sensitivity
    mouseState.current.euler.x -= movementY * sensitivity
    
    // Clamp vertical rotation
    mouseState.current.euler.x = Math.max(
      -mouseState.current.PI_2, 
      Math.min(mouseState.current.PI_2, mouseState.current.euler.x)
    )
    
    camera.quaternion.setFromEuler(mouseState.current.euler)
  }, [enabled, camera])
  
  // Keyboard handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !mouseState.current.isLocked) return
    
    // Ignore if typing in input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        moveState.current.forward = true
        break
      case 'KeyS':
      case 'ArrowDown':
        moveState.current.backward = true
        break
      case 'KeyA':
      case 'ArrowLeft':
        moveState.current.left = true
        break
      case 'KeyD':
      case 'ArrowRight':
        moveState.current.right = true
        break
      case 'Space':
        moveState.current.up = true
        event.preventDefault()
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        moveState.current.down = true
        break
      case 'Escape':
        document.exitPointerLock()
        break
    }
  }, [enabled])
  
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        moveState.current.forward = false
        break
      case 'KeyS':
      case 'ArrowDown':
        moveState.current.backward = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        moveState.current.left = false
        break
      case 'KeyD':
      case 'ArrowRight':
        moveState.current.right = false
        break
      case 'Space':
        moveState.current.up = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        moveState.current.down = false
        break
    }
  }, [])
  
  // Setup event listeners
  useEffect(() => {
    if (!enabled) return
    
    // Click to lock pointer
    gl.domElement.addEventListener('click', requestPointerLock)
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('pointerlockerror', handlePointerLockError)
    
    // Mouse movement
    document.addEventListener('mousemove', handleMouseMove)
    
    // Keyboard
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      gl.domElement.removeEventListener('click', requestPointerLock)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('pointerlockerror', handlePointerLockError)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      
      // Exit pointer lock on cleanup
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock()
      }
    }
  }, [enabled, gl, requestPointerLock, handlePointerLockChange, handlePointerLockError, handleMouseMove, handleKeyDown, handleKeyUp])
  
  // Animation frame - movement logic
  useFrame((_, delta) => {
    if (!enabled) return
    
    // Allow mobile input without pointer lock
    const hasMobileInput = mobileInput && (
      Math.abs(mobileInput.move.x) > 0.1 || 
      Math.abs(mobileInput.move.y) > 0.1 ||
      Math.abs(mobileInput.look.x) > 0.1 ||
      Math.abs(mobileInput.look.y) > 0.1
    )
    
    if (!mouseState.current.isLocked && !hasMobileInput) return
    
    // Get movement speed from store (high speed for smooth experience)
    const moveSpeed = player.moveSpeed || 25
    const friction = 6
    
    // Handle mobile look input
    if (mobileInput && (Math.abs(mobileInput.look.x) > 0.1 || Math.abs(mobileInput.look.y) > 0.1)) {
      const lookSpeed = 2
      mouseState.current.euler.setFromQuaternion(camera.quaternion)
      mouseState.current.euler.y -= mobileInput.look.x * lookSpeed * delta
      mouseState.current.euler.x -= mobileInput.look.y * lookSpeed * delta
      mouseState.current.euler.x = Math.max(
        -mouseState.current.PI_2,
        Math.min(mouseState.current.PI_2, mouseState.current.euler.x)
      )
      camera.quaternion.setFromEuler(mouseState.current.euler)
    }
    
    // Calculate direction from keyboard input
    direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward)
    direction.current.x = Number(moveState.current.right) - Number(moveState.current.left)
    direction.current.y = Number(moveState.current.up) - Number(moveState.current.down)
    
    // Add mobile joystick input
    if (mobileInput) {
      direction.current.z += -mobileInput.move.y // Joystick Y is inverted
      direction.current.x += mobileInput.move.x
    }
    
    direction.current.normalize()
    
    // Apply friction/damping
    velocity.current.x -= velocity.current.x * friction * delta
    velocity.current.y -= velocity.current.y * friction * delta
    velocity.current.z -= velocity.current.z * friction * delta
    
    // Apply movement (check both keyboard and mobile input)
    const hasForwardBack = moveState.current.forward || moveState.current.backward || (mobileInput && Math.abs(mobileInput.move.y) > 0.1)
    const hasLeftRight = moveState.current.left || moveState.current.right || (mobileInput && Math.abs(mobileInput.move.x) > 0.1)
    
    if (hasForwardBack) {
      velocity.current.z += direction.current.z * moveSpeed * delta * friction
    }
    if (hasLeftRight) {
      velocity.current.x += direction.current.x * moveSpeed * delta * friction
    }
    if (moveState.current.up || moveState.current.down) {
      velocity.current.y += direction.current.y * moveSpeed * delta * friction
    }
    
    // Apply velocity to camera (world-space movement)
    // Forward/backward movement in camera's local Z axis
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0 // Keep movement horizontal
    forward.normalize()
    
    // Right vector
    const right = new THREE.Vector3()
    right.crossVectors(forward, camera.up).normalize()
    
    // Calculate final movement
    const moveX = right.x * velocity.current.x + forward.x * velocity.current.z
    const moveY = velocity.current.y
    const moveZ = right.z * velocity.current.x + forward.z * velocity.current.z
    
    // Update position
    playerPosition.current.x += moveX * delta
    playerPosition.current.y += moveY * delta
    playerPosition.current.z += moveZ * delta
    
    // Collision detection - only if collision meshes are defined
    if (octree.current && collisionMeshes.length > 0) {
      // Store previous position to revert if stuck
      const prevPosition = playerPosition.current.clone()
      
      // Update capsule position
      playerCapsule.current.start.set(
        playerPosition.current.x,
        playerPosition.current.y + PLAYER_CAPSULE_OFFSET,
        playerPosition.current.z
      )
      playerCapsule.current.end.set(
        playerPosition.current.x,
        playerPosition.current.y + PLAYER_HEIGHT - PLAYER_RADIUS,
        playerPosition.current.z
      )
      
      // Check for collisions and push out
      const maxIterations = 8
      let totalPushback = new THREE.Vector3()
      let collisionCount = 0
      
      for (let i = 0; i < maxIterations; i++) {
        const result = octree.current.capsuleIntersect(playerCapsule.current)
        
        if (result) {
          collisionCount++
          
          // Limit pushback to prevent flying away
          const maxPushback = 0.5
          const clampedDepth = Math.min(result.depth, maxPushback)
          
          // Push player out of collision
          const pushback = result.normal.clone().multiplyScalar(clampedDepth + 0.001)
          playerPosition.current.add(pushback)
          totalPushback.add(pushback)
          
          // Update capsule position
          playerCapsule.current.start.set(
            playerPosition.current.x,
            playerPosition.current.y + PLAYER_CAPSULE_OFFSET,
            playerPosition.current.z
          )
          playerCapsule.current.end.set(
            playerPosition.current.x,
            playerPosition.current.y + PLAYER_HEIGHT - PLAYER_RADIUS,
            playerPosition.current.z
          )
          
          // If on ground (collision normal pointing up), stop vertical velocity
          if (result.normal.y > 0.5) {
            velocity.current.y = Math.max(0, velocity.current.y)
          }
          // If hitting ceiling
          if (result.normal.y < -0.5) {
            velocity.current.y = Math.min(0, velocity.current.y)
          }
          // If hitting wall, reduce horizontal velocity
          if (Math.abs(result.normal.y) < 0.5) {
            velocity.current.x *= 0.5
            velocity.current.z *= 0.5
          }
        } else {
          break // No more collisions
        }
      }
      
      // If we had too many collisions or moved too far, revert to previous position
      if (collisionCount >= maxIterations || totalPushback.length() > 2.0) {
        playerPosition.current.copy(prevPosition)
        velocity.current.set(0, 0, 0)
        log('Position reverted due to excessive collision')
      }
    }
    
    // Apply to camera
    camera.position.copy(playerPosition.current)
    
    // Callback for external systems (like interaction zones, minimap)
    // Pass Y rotation (yaw) for minimap direction indicator
    onPositionChange?.(playerPosition.current, mouseState.current.euler.y)
  })
  
  // No visual elements, just controls
  return null
}

// Hook to check if player is in pointer lock mode
export function usePlayerLock() {
  const { gl } = useThree()
  return document.pointerLockElement === gl.domElement
}
