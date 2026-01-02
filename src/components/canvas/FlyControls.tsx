import { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Fly Controls Component - Left-click + WASD to fly
export function FlyControls() {
  const { camera, gl, controls } = useThree()
  const isLeftMouseDown = useRef(false)
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
  })
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const flySpeed = useRef(10)
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(10)
  const speedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const mouseSensitivity = 0.002
  const minSpeed = 1
  const maxSpeed = 50

  useEffect(() => {
    const canvas = gl.domElement

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        isLeftMouseDown.current = true
        canvas.style.cursor = 'crosshair'
        // Disable OrbitControls while flying
        if (controls) {
          (controls as any).enabled = false
        }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isLeftMouseDown.current = false
        canvas.style.cursor = 'default'
        // Re-enable OrbitControls
        if (controls) {
          (controls as any).enabled = true
        }
        // Reset move state when releasing left mouse
        moveState.current = {
          forward: false,
          backward: false,
          left: false,
          right: false,
          up: false,
          down: false
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isLeftMouseDown.current) return

      euler.current.setFromQuaternion(camera.quaternion)
      euler.current.y -= e.movementX * mouseSensitivity
      euler.current.x -= e.movementY * mouseSensitivity
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x))
      camera.quaternion.setFromEuler(euler.current)
      
      // Update OrbitControls target to be in front of camera
      if (controls) {
        const target = new THREE.Vector3()
        camera.getWorldDirection(target)
        target.multiplyScalar(5).add(camera.position)
        ;(controls as any).target.copy(target)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (!isLeftMouseDown.current) return
      
      e.preventDefault()
      e.stopPropagation()
      
      // Adjust speed with scroll
      const delta = e.deltaY > 0 ? -2 : 2
      flySpeed.current = Math.max(minSpeed, Math.min(maxSpeed, flySpeed.current + delta))
      setCurrentSpeed(flySpeed.current)
      
      // Show speed indicator
      setShowSpeedIndicator(true)
      if (speedTimeoutRef.current) {
        clearTimeout(speedTimeoutRef.current)
      }
      speedTimeoutRef.current = setTimeout(() => {
        setShowSpeedIndicator(false)
      }, 1500)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLeftMouseDown.current) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.code) {
        case 'KeyW': moveState.current.forward = true; break
        case 'KeyS': moveState.current.backward = true; break
        case 'KeyA': moveState.current.left = true; break
        case 'KeyD': moveState.current.right = true; break
        case 'KeyE': case 'Space': moveState.current.up = true; e.preventDefault(); break
        case 'KeyQ': case 'ShiftLeft': moveState.current.down = true; break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': moveState.current.forward = false; break
        case 'KeyS': moveState.current.backward = false; break
        case 'KeyA': moveState.current.left = false; break
        case 'KeyD': moveState.current.right = false; break
        case 'KeyE': case 'Space': moveState.current.up = false; break
        case 'KeyQ': case 'ShiftLeft': moveState.current.down = false; break
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault() // Prevent context menu on right click
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('contextmenu', handleContextMenu)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('contextmenu', handleContextMenu)
      if (speedTimeoutRef.current) {
        clearTimeout(speedTimeoutRef.current)
      }
    }
  }, [camera, gl, controls])

  useFrame((_, delta) => {
    if (!isLeftMouseDown.current) return

    const { forward, backward, left, right, up, down } = moveState.current
    
    // Calculate direction
    const direction = new THREE.Vector3()
    direction.z = Number(forward) - Number(backward)
    direction.x = Number(right) - Number(left)
    direction.y = Number(up) - Number(down)

    if (direction.length() === 0) return

    direction.normalize()

    // Get camera's forward and right vectors
    const cameraForward = new THREE.Vector3()
    camera.getWorldDirection(cameraForward)
    
    const cameraRight = new THREE.Vector3()
    cameraRight.crossVectors(cameraForward, camera.up).normalize()

    const cameraUp = new THREE.Vector3(0, 1, 0)

    // Calculate movement
    const move = new THREE.Vector3()
    move.addScaledVector(cameraForward, direction.z)
    move.addScaledVector(cameraRight, direction.x)
    move.addScaledVector(cameraUp, direction.y)
    move.normalize().multiplyScalar(flySpeed.current * delta)

    camera.position.add(move)
    
    // Update OrbitControls target to follow camera
    if (controls) {
      const target = new THREE.Vector3()
      camera.getWorldDirection(target)
      target.multiplyScalar(5).add(camera.position)
      ;(controls as any).target.copy(target)
    }
  })

  // Dispatch speed change event for UI
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('fly-speed-change', { detail: { speed: currentSpeed, visible: showSpeedIndicator } }))
  }, [currentSpeed, showSpeedIndicator])

  return null
}

// Speed Indicator UI Component
export function FlySpeedIndicator() {
  const [speed, setSpeed] = useState(10)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleSpeedChange = (e: CustomEvent<{ speed: number; visible: boolean }>) => {
      setSpeed(e.detail.speed)
      setVisible(e.detail.visible)
    }
    window.addEventListener('fly-speed-change', handleSpeedChange as EventListener)
    return () => window.removeEventListener('fly-speed-change', handleSpeedChange as EventListener)
  }, [])

  if (!visible) return null

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#111618]/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 animate-fade-in-up">
      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <div className="flex items-center gap-2">
        <span className="text-white/60 text-xs">Hız:</span>
        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(speed / 50) * 100}%` }}
          />
        </div>
        <span className="text-white text-sm font-mono w-8">{speed}</span>
      </div>
    </div>
  )
}
