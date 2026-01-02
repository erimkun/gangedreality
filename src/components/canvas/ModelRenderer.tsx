import { useRef, useEffect, Suspense, useMemo } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '@/store/useProjectStore'
import { useEditorStore } from '@/store/useEditorStore'
import { useVariantsStore } from '@/store/useVariantsStore'

// Debug logger utility
const DEBUG = true
const log = (context: string, message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ModelRenderer/${context}]`, message, data !== undefined ? data : '')
  }
}

interface ModelRendererProps {
  isEditor?: boolean
}

// Default Box when no model is loaded
function DefaultScene({ isEditor }: { isEditor?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { selectObject, registerMesh, clearMeshRegistry } = useEditorStore()
  
  // Register default scene meshes
  useEffect(() => {
    if (isEditor && meshRef.current) {
      log('DefaultScene', 'Registering default box mesh')
      clearMeshRegistry()
      registerMesh({
        id: 'default-box',
        name: 'DefaultBox',
        object: meshRef.current,
        visible: true,
        type: 'mesh'
      })
      log('DefaultScene', 'Default mesh registered successfully')
    }
    
    return () => {
      log('DefaultScene', 'Cleanup - clearing mesh registry')
    }
  }, [isEditor, registerMesh, clearMeshRegistry])
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isEditor && meshRef.current) {
      e.stopPropagation()
      log('DefaultScene', 'Box clicked, selecting')
      selectObject(meshRef.current, 'default-box', 'DefaultBox')
    }
  }
  
  return (
    <group>
      {/* Demo Floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#404040" />
      </mesh>
      
      {/* Demo Box */}
      <mesh 
        ref={meshRef}
        position={[0, 1, 0]} 
        castShadow
        onClick={handleClick}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#e94560" />
      </mesh>
      
      {/* Demo Instructions */}
      {isEditor && (
        <group position={[0, 3, 0]}>
          {/* Text would go here - using HTML overlay instead */}
        </group>
      )}
    </group>
  )
}

// GLB Model Loader
function LoadedModel({ 
  config, 
  isEditor 
}: { 
  config: { 
    id: string
    url: string
    name: string
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
    visible: boolean
  }
  isEditor?: boolean 
}) {
  const gltf = useGLTF(config.url)
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone()
    
    // Calculate bounding box to understand model size
    const box = new THREE.Box3().setFromObject(cloned)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    
    log('LoadedModel', 'Model bounding box', {
      size: { x: size.x, y: size.y, z: size.z },
      center: { x: center.x, y: center.y, z: center.z },
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z }
    })
    
    return cloned
  }, [gltf.scene])
  const { selectObject, registerMesh, unregisterMesh } = useEditorStore()
  const { configurableGroups } = useVariantsStore()
  
  log('LoadedModel', 'Component mounted with URL:', config.url)
  
  useEffect(() => {
    log('LoadedModel', 'Scene loaded, processing...', { 
      childCount: scene.children.length,
      isEditor 
    })
    
    let meshCount = 0
    let groupCount = 0
    const registeredIds: string[] = []
    
    // Setup shadows and materials, register meshes from ORIGINAL scene
    scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        meshCount++
        
        // Store original material for reset
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material.clone()
        }
        
        // Register mesh for outliner (only in editor mode)
        if (isEditor) {
          const meshId = child.uuid
          const meshName = child.name || `Mesh_${meshCount}`
          
          log('LoadedModel', `Registering mesh: ${meshName}`, { id: meshId })
          
          registerMesh({
            id: meshId,
            name: meshName,
            object: child,
            visible: true,
            type: 'mesh',
            parentId: config.id // Associate with model ID
          })
          registeredIds.push(meshId)
        }
      } else if (child instanceof THREE.Group && child !== scene) {
        groupCount++
        
        // Optionally register groups too
        if (isEditor && child.name) {
          log('LoadedModel', `Registering group: ${child.name}`)
          registerMesh({
            id: child.uuid,
            name: child.name,
            object: child,
            visible: true,
            type: 'group',
            parentId: config.id
          })
          registeredIds.push(child.uuid)
        }
      }
    })
    
    log('LoadedModel', 'Scene processing complete', { meshCount, groupCount })

    return () => {
      if (isEditor) {
        log('LoadedModel', 'Cleanup - unregistering meshes', { count: registeredIds.length })
        registeredIds.forEach(id => unregisterMesh(id))
      }
    }
    
  }, [scene, isEditor, registerMesh, unregisterMesh, config.id])
  
  // Apply variant materials - Only in Viewer/Player mode, not in Editor
  useEffect(() => {
    // Skip variant application in editor mode
    if (isEditor) {
      log('LoadedModel', 'Skipping variant application in editor mode')
      return
    }
    
    log('LoadedModel', 'Applying variant materials', { 
      groupCount: configurableGroups.length 
    })
    
    configurableGroups.forEach(group => {
      // Skip if no option selected
      if (group.selectedOptionIndex === null || group.selectedOptionIndex < 0) return
      
      const selectedOption = group.options[group.selectedOptionIndex]
      if (!selectedOption) return
      
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && group.targetMeshNames.includes(child.name)) {
          log('LoadedModel', `Applying variant to mesh: ${child.name}`, selectedOption)
          
          if (selectedOption.type === 'color' && selectedOption.value) {
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material = child.material.clone()
              child.material.color.set(selectedOption.value)
              child.material.map = null // Remove texture if switching to color
              child.material.needsUpdate = true
            }
          } else if (selectedOption.type === 'texture' && selectedOption.textureUrl) {
            // Load and apply texture
            const textureLoader = new THREE.TextureLoader()
            textureLoader.load(selectedOption.textureUrl, (texture) => {
              // Apply tiling if specified
              if (selectedOption.tiling) {
                texture.wrapS = THREE.RepeatWrapping
                texture.wrapT = THREE.RepeatWrapping
                texture.repeat.set(selectedOption.tiling[0], selectedOption.tiling[1])
              }
              
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material = child.material.clone()
                child.material.map = texture
                child.material.color.set('#ffffff') // Reset color to white so texture shows properly
                child.material.needsUpdate = true
                log('LoadedModel', `Texture applied to ${child.name}`)
              }
            }, undefined, (error) => {
              log('LoadedModel', `Error loading texture for ${child.name}`, error)
            })
          }
        }
      })
    })
  }, [configurableGroups, scene, isEditor])
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    
    const clickedMesh = e.object as THREE.Mesh
    log('LoadedModel', 'Mesh clicked:', { 
      name: clickedMesh.name, 
      uuid: clickedMesh.uuid,
      isEditor
    })
    
    if (isEditor) {
      selectObject(clickedMesh, clickedMesh.uuid, clickedMesh.name)
    } else {
      // In viewer mode, check if this mesh has a variant group
      const variantGroup = configurableGroups.find(g => 
        g.targetMeshNames.includes(clickedMesh.name)
      )
      if (variantGroup) {
        // Dispatch custom event for hotspot click
        window.dispatchEvent(new CustomEvent('variant-hotspot-click', {
          detail: { groupId: variantGroup.id, meshName: clickedMesh.name }
        }))
        log('LoadedModel', 'Variant hotspot clicked', { groupId: variantGroup.id })
      }
    }
  }
  
  return (
    <primitive 
      object={scene} 
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
      visible={config.visible}
      onClick={handleClick}
    />
  )
}

export default function ModelRenderer({ isEditor = false }: ModelRendererProps) {
  const { assets } = useProjectStore()
  
  // Safe access to models
  const models = assets.models || []
  
  // Backward compatibility: if no models array but mainModel exists
  const modelsToRender = models.length > 0 
    ? models 
    : assets.mainModel 
      ? [{
          id: 'main-model',
          name: 'Main Model',
          url: assets.mainModel,
          position: [0, 0, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          visible: true
        }]
      : []
  
  log('ModelRenderer', 'Render called', { 
    modelsCount: modelsToRender.length,
    mainModel: assets.mainModel,
    models: models,
    isEditor
  })
  
  return (
    <Suspense fallback={null}>
      {modelsToRender.length > 0 ? (
        <group>
          {modelsToRender.map(model => (
            <LoadedModel 
              key={model.id} 
              config={model} 
              isEditor={isEditor} 
            />
          ))}
        </group>
      ) : (
        <DefaultScene isEditor={isEditor} />
      )}
    </Suspense>
  )
}
