import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useHelper, Sphere, Cone } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { useSceneStore } from '@/store/useSceneStore'
import { useEditorStore } from '@/store/useEditorStore'
import { LightConfig } from '@/types'

// Debug logger
const DEBUG = false
const log = (message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[LightingManager]`, message, data !== undefined ? data : '')
  }
}

interface LightingManagerProps {
  showHelpers?: boolean
  isEditor?: boolean
}

// Clickable light wrapper for selection
function ClickableLightMesh({ 
  light, 
  children,
  isEditor = false 
}: { 
  light: LightConfig
  children: React.ReactNode
  isEditor?: boolean 
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const { selectObject, selectedObjectId, registerMesh, unregisterMesh } = useEditorStore()
  const isSelected = selectedObjectId === light.id

  // Register/unregister light in sceneMeshes for outliner
  useEffect(() => {
    if (!isEditor || !groupRef.current) return
    
    registerMesh({
      id: light.id,
      name: `${light.type.charAt(0).toUpperCase() + light.type.slice(1)} Light`,
      object: groupRef.current,
      visible: true,
      type: 'light'
    })
    
    return () => {
      unregisterMesh(light.id)
    }
  }, [isEditor, light.id, light.type, registerMesh, unregisterMesh])
  
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!isEditor) return
    e.stopPropagation()
    
    if (groupRef.current) {
      selectObject(groupRef.current, light.id, light.type)
      log('Light selected', { id: light.id, type: light.type })
    }
  }, [isEditor, light.id, light.type, selectObject])
  
  return (
    <group 
      ref={groupRef} 
      name={light.id}
      position={light.position}
      onClick={handleClick}
    >
      {children}
      {/* Highlight when selected */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}

// Individual light components with helpers
function DirectionalLightWithHelper({ light, showHelper, isEditor }: { light: LightConfig; showHelper: boolean; isEditor: boolean }) {
  const lightRef = useRef<THREE.DirectionalLight>(null!)
  
  // Conditionally use helper
  useHelper(showHelper ? lightRef : null, THREE.DirectionalLightHelper, 1, light.color)
  
  useEffect(() => {
    if (lightRef.current && light.target) {
      const [x, y, z] = light.target
      lightRef.current.target.position.set(x, y, z)
      lightRef.current.target.updateMatrixWorld()
    }
  }, [light.target])
  
  return (
    <ClickableLightMesh light={light} isEditor={isEditor}>
      <directionalLight
        ref={lightRef}
        intensity={light.intensity}
        color={light.color}
        castShadow={light.castShadow}
        shadow-bias={light.shadowBias || -0.0001}
        shadow-mapSize={[light.shadowMapSize || 2048, light.shadowMapSize || 2048]}
        shadow-radius={light.shadowRadius || 1}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      {/* Visible mesh for selection */}
      {isEditor && (
        <Sphere args={[0.2, 16, 16]}>
          <meshBasicMaterial color={light.color} transparent opacity={0.8} />
        </Sphere>
      )}
    </ClickableLightMesh>
  )
}

function PointLightWithHelper({ light, showHelper, isEditor }: { light: LightConfig; showHelper: boolean; isEditor: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null!)
  
  useHelper(showHelper ? lightRef : null, THREE.PointLightHelper, 0.5, light.color)
  
  return (
    <ClickableLightMesh light={light} isEditor={isEditor}>
      <pointLight
        ref={lightRef}
        intensity={light.intensity}
        color={light.color}
        castShadow={light.castShadow}
        distance={light.distance || 0}
        decay={light.decay || 2}
        shadow-bias={light.shadowBias || -0.0001}
        shadow-mapSize={[light.shadowMapSize || 1024, light.shadowMapSize || 1024]}
        shadow-radius={light.shadowRadius || 1}
      />
      {/* Visible mesh for selection - lightbulb shape */}
      {isEditor && (
        <group>
          <Sphere args={[0.15, 16, 16]}>
            <meshBasicMaterial color={light.color} transparent opacity={0.9} />
          </Sphere>
          {/* Rays indicator */}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <mesh key={angle} rotation={[0, 0, (angle * Math.PI) / 180]}>
              <boxGeometry args={[0.02, 0.3, 0.02]} />
              <meshBasicMaterial color={light.color} transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      )}
    </ClickableLightMesh>
  )
}

function SpotLightWithHelper({ light, showHelper, isEditor }: { light: LightConfig; showHelper: boolean; isEditor: boolean }) {
  const lightRef = useRef<THREE.SpotLight>(null!)
  
  useHelper(showHelper ? lightRef : null, THREE.SpotLightHelper, light.color)
  
  useEffect(() => {
    if (lightRef.current && light.target) {
      const [x, y, z] = light.target
      lightRef.current.target.position.set(x, y, z)
      lightRef.current.target.updateMatrixWorld()
    }
  }, [light.target])
  
  // Calculate direction for cone orientation
  const direction = new THREE.Vector3()
  if (light.target) {
    direction.set(
      light.target[0] - light.position[0],
      light.target[1] - light.position[1],
      light.target[2] - light.position[2]
    ).normalize()
  } else {
    direction.set(0, -1, 0)
  }
  
  // Create quaternion for cone rotation
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction)
  
  return (
    <ClickableLightMesh light={light} isEditor={isEditor}>
      <spotLight
        ref={lightRef}
        intensity={light.intensity}
        color={light.color}
        castShadow={light.castShadow}
        angle={light.angle || Math.PI / 6}
        penumbra={light.penumbra || 0.5}
        distance={light.distance || 0}
        decay={light.decay || 2}
        shadow-bias={light.shadowBias || -0.0001}
        shadow-mapSize={[light.shadowMapSize || 1024, light.shadowMapSize || 1024]}
        shadow-radius={light.shadowRadius || 1}
      />
      {/* Visible mesh for selection - cone shape */}
      {isEditor && (
        <group quaternion={quaternion}>
          <Cone args={[0.15, 0.3, 16]} position={[0, -0.15, 0]}>
            <meshBasicMaterial color={light.color} transparent opacity={0.8} />
          </Cone>
          <Sphere args={[0.08, 16, 16]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </Sphere>
        </group>
      )}
    </ClickableLightMesh>
  )
}

export default function LightingManager({ showHelpers = true, isEditor = false }: LightingManagerProps) {
  const { lights, environment } = useSceneStore()
  
  log('Rendering lights', { count: lights.length, showHelpers, isEditor })
  
  return (
    <group name="lighting-manager">
      {/* Global Lights */}
      {environment.ambientLight && (
        <ambientLight 
          intensity={environment.ambientLight.intensity} 
          color={environment.ambientLight.color} 
        />
      )}
      
      {environment.hemisphereLight && (
        <hemisphereLight 
          intensity={environment.hemisphereLight.intensity} 
          color={environment.hemisphereLight.skyColor}
          groundColor={environment.hemisphereLight.groundColor}
        />
      )}

      {lights.map(light => {
        log(`Rendering ${light.type} light`, { id: light.id, intensity: light.intensity, position: light.position })
        
        switch (light.type) {
          case 'directional':
            return (
              <DirectionalLightWithHelper 
                key={light.id} 
                light={light} 
                showHelper={showHelpers}
                isEditor={isEditor}
              />
            )
            
          case 'point':
            return (
              <PointLightWithHelper 
                key={light.id} 
                light={light} 
                showHelper={showHelpers}
                isEditor={isEditor}
              />
            )
            
          case 'spot':
            return (
              <SpotLightWithHelper 
                key={light.id} 
                light={light} 
                showHelper={showHelpers}
                isEditor={isEditor}
              />
            )
            
          case 'ambient':
            // Deprecated: use environment.ambientLight instead
            return (
              <ambientLight
                key={light.id}
                intensity={light.intensity}
                color={light.color}
              />
            )
            
          default:
            return null
        }
      })}
    </group>
  )
}
