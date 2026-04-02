import { useRef, useEffect, Suspense, useMemo } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '@/store/useProjectStore'
import { useEditorStore } from '@/store/useEditorStore'
import { useSceneStore } from '@/store/useSceneStore'
import { useVariantsStore } from '@/store/useVariantsStore'
import { useHotspotStore } from '@/store/useHotspotStore'
import { ModelConfig } from '@/types'

// Debug logger utility
const DEBUG = false
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
  const selectObject = useEditorStore(state => state.selectObject)
  const registerMesh = useEditorStore(state => state.registerMesh)
  const clearMeshRegistry = useEditorStore(state => state.clearMeshRegistry)
  
  // Track pointer down position
  const pointerDownPos = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY }
  }
  
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
    // Check drag distance
    const dist = Math.sqrt(
      Math.pow(e.clientX - pointerDownPos.current.x, 2) + 
      Math.pow(e.clientY - pointerDownPos.current.y, 2)
    )
    
    if (dist > 5) return

    // Check global state directly to avoid closure staleness
    const isHotspotMode = useHotspotStore.getState().isHotspotMode
    
    if (isEditor && meshRef.current) {
      e.stopPropagation()
      
      if (isHotspotMode) {
        log('DefaultScene', 'Hotspot mode active, ignoring click')
        return
      }

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
        onPointerDown={handlePointerDown}
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
  config: ModelConfig
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
  
  const selectObject = useEditorStore(state => state.selectObject)
  const registerMeshes = useEditorStore(state => state.registerMeshes)
  const unregisterMesh = useEditorStore(state => state.unregisterMesh)
  
  const { configurableGroups } = useVariantsStore()
  const { isHotspotMode, settings } = useHotspotStore()
  const deletedMeshIds = useSceneStore(state => state.deletedMeshIds)
  
  // Track pointer down position to distinguish clicks from drags
  const pointerDownPos = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY }
  }
  
  log('LoadedModel', 'Component mounted with URL:', config.url)
  
  // Hotspot Mode Isolation Logic
  useEffect(() => {
    if (!isEditor) return

    // User requested NOT to hide everything, just specific things.
    // So we disable this aggressive isolation logic for now.
    // If we want to re-enable "only show walkable", we can uncomment this.
    
    /*
    const walkableIds = settings.walkableMeshIds || []
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (isHotspotMode) {
          // Isolation Mode: Only show walkable meshes
          const isWalkable = walkableIds.includes(child.name) || walkableIds.includes(child.uuid)
          
          if (isWalkable) {
            child.visible = true
          } else {
            child.visible = false
          }
        } else {
          // Normal Mode: Restore visibility
          child.visible = true
        }
      }
    })
    */
   
   // Ensure everything is visible when mode changes (cleanup)
   if (!isHotspotMode) {
     scene.traverse((child) => {
       if (child instanceof THREE.Mesh) {
         child.visible = true
       }
     })
   }
  }, [isHotspotMode, settings.walkableMeshIds, scene, isEditor])
  
  useEffect(() => {
    log('LoadedModel', 'Scene loaded, processing...', { 
      childCount: scene.children.length,
      isEditor 
    })
    
    let meshCount = 0
    let groupCount = 0
    const registeredIds: string[] = []
    const meshesToRegister: any[] = []
    
    // Setup shadows and materials, register meshes from ORIGINAL scene
    scene.traverse((child: THREE.Object3D) => {
      // Check if deleted
      const isDeleted = deletedMeshIds?.includes(child.uuid) || (child.name && deletedMeshIds?.includes(child.name))
      
      if (isDeleted) {
        child.visible = false
      }

      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        meshCount++
        
        // Store original material for reset
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material
        }
        
        // Register mesh for outliner (only in editor mode)
        if (isEditor) {
          const meshId = child.uuid
          const meshName = child.name || `Mesh_${meshCount}`
          
          // log('LoadedModel', `Registering mesh: ${meshName}`, { id: meshId })
          
          meshesToRegister.push({
            id: meshId,
            name: meshName,
            object: child,
            visible: !isDeleted,
            type: 'mesh',
            parentId: config.id // Associate with model ID
          })
          registeredIds.push(meshId)
        }
      } else if (child instanceof THREE.Group && child !== scene) {
        groupCount++
        
        // Optionally register groups too
        if (isEditor && child.name) {
          // log('LoadedModel', `Registering group: ${child.name}`)
          meshesToRegister.push({
            id: child.uuid,
            name: child.name,
            object: child,
            visible: !isDeleted,
            type: 'group',
            parentId: config.id
          })
          registeredIds.push(child.uuid)
        }
      }
    })

    if (isEditor && meshesToRegister.length > 0) {
      log('LoadedModel', `Batch registering ${meshesToRegister.length} items`)
      registerMeshes(meshesToRegister)
    }
    
    log('LoadedModel', 'Scene processing complete', { meshCount, groupCount })

    return () => {
      if (isEditor) {
        log('LoadedModel', 'Cleanup - unregistering meshes', { count: registeredIds.length })
        registeredIds.forEach(id => unregisterMesh(id))
      }
    }
    
  }, [scene, isEditor, registerMeshes, unregisterMesh, config.id, deletedMeshIds])
  
  // Apply variant materials - Works in both Editor and Viewer modes for live preview
  useEffect(() => {
    log('LoadedModel', 'Applying variant materials', { 
      groupCount: configurableGroups.length,
      isEditor
    })
    
    // Skip if no groups
    if (configurableGroups.length === 0) return
    
    // Cache for created variant materials to share them across meshes
    // Key format: `${groupId}-${optionIndex}-${originalMaterialUuid}`
    const variantMaterialCache = new Map<string, THREE.Material>()
    
    // Track loaded textures for cleanup
    const loadedTextures: THREE.Texture[] = []
    
    // Create texture loader with crossOrigin support for blob URLs
    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous'

    configurableGroups.forEach(group => {
      // Skip if no option selected
      if (group.selectedOptionIndex === null || group.selectedOptionIndex < 0) return
      
      const selectedOption = group.options[group.selectedOptionIndex]
      if (!selectedOption) return
      
      log('LoadedModel', `Processing group: ${group.displayName}`, {
        selectedIndex: group.selectedOptionIndex,
        optionName: selectedOption.name,
        optionType: selectedOption.type,
        meshCount: group.targetMeshNames.length
      })
      
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && group.targetMeshNames.includes(child.name)) {
          
          // Get original material (fallback to current if not saved yet)
          const originalMat = child.userData.originalMaterial || child.material
          
          // Create unique key for this variant + base material combination
          const cacheKey = `${group.id}-${group.selectedOptionIndex}-${originalMat.uuid}`
          
          if (variantMaterialCache.has(cacheKey)) {
            // Use cached material
            const cachedMat = variantMaterialCache.get(cacheKey)
            if (child.material !== cachedMat) {
              child.material = cachedMat!
              // log('LoadedModel', `Applied cached material to ${child.name}`)
            }
          } else {
            log('LoadedModel', `Creating new material for ${child.name}`, selectedOption)
            
            let newMat: THREE.Material

            if (originalMat instanceof THREE.MeshStandardMaterial) {
              newMat = originalMat.clone()
              const stdMat = newMat as THREE.MeshStandardMaterial

              if (selectedOption.type === 'color' && selectedOption.value) {
                stdMat.color.set(selectedOption.value)
                stdMat.map = null // Remove texture if switching to color
                // Apply metalness and roughness for color variants too
                if (selectedOption.metalness !== undefined) stdMat.metalness = selectedOption.metalness
                if (selectedOption.roughness !== undefined) stdMat.roughness = selectedOption.roughness
                stdMat.needsUpdate = true
              } else if (selectedOption.type === 'texture') {
                // Get tiling values with defaults
                const tilingX = selectedOption.tiling?.[0] ?? 1
                const tilingY = selectedOption.tiling?.[1] ?? 1
                
                // Helper to apply tiling and UV settings
                const applyTextureSettings = (tex: THREE.Texture, isSRGB: boolean = false) => {
                  // Always enable repeat wrapping for proper UV handling
                  tex.wrapS = THREE.RepeatWrapping
                  tex.wrapT = THREE.RepeatWrapping
                  tex.repeat.set(tilingX, tilingY)
                  
                  // Flip Y for proper orientation (common for uploaded textures)
                  tex.flipY = true
                  
                  // Set color space (try-catch: some DataTexture types have read-only colorSpace)
                  if (isSRGB) {
                    try { tex.colorSpace = THREE.SRGBColorSpace } catch { /* read-only */ }
                  }
                  
                  // Generate mipmaps for better quality
                  tex.generateMipmaps = true
                  tex.minFilter = THREE.LinearMipmapLinearFilter
                  tex.magFilter = THREE.LinearFilter
                }

                // 1. Load Albedo/Color Map
                if (selectedOption.textureUrl) {
                  log('LoadedModel', `Loading texture from: ${selectedOption.textureUrl}`)
                  textureLoader.load(
                    selectedOption.textureUrl, 
                    (texture) => {
                      applyTextureSettings(texture, true) // sRGB for color maps
                      loadedTextures.push(texture)
                      stdMat.map = texture
                      stdMat.color.set('#ffffff') // Reset color to white so texture shows properly
                      stdMat.needsUpdate = true
                      log('LoadedModel', `✓ Texture loaded for ${child.name}`, { 
                        size: `${texture.image?.width}x${texture.image?.height}`,
                        tiling: [tilingX, tilingY]
                      })
                    }, 
                    () => {
                      // Loading progress
                    },
                    (err) => {
                      console.error('Error loading texture:', err, selectedOption.textureUrl)
                    }
                  )
                }

                // 2. Load Normal Map
                if (selectedOption.normalMapUrl) {
                  textureLoader.load(
                    selectedOption.normalMapUrl, 
                    (normalMap) => {
                      applyTextureSettings(normalMap, false) // Linear for normal maps
                      try { normalMap.colorSpace = THREE.NoColorSpace } catch { /* read-only */ }
                      loadedTextures.push(normalMap)
                      stdMat.normalMap = normalMap
                      stdMat.needsUpdate = true
                      log('LoadedModel', `✓ Normal map loaded for ${child.name}`)
                    }, 
                    undefined, 
                    (err) => console.error('Error loading normal map', err)
                  )
                }

                // 3. Load Roughness Map
                if (selectedOption.roughnessMapUrl) {
                  textureLoader.load(
                    selectedOption.roughnessMapUrl, 
                    (roughnessMap) => {
                      applyTextureSettings(roughnessMap, false) // Linear for roughness maps
                      try { roughnessMap.colorSpace = THREE.NoColorSpace } catch { /* read-only */ }
                      loadedTextures.push(roughnessMap)
                      stdMat.roughnessMap = roughnessMap
                      stdMat.needsUpdate = true
                      log('LoadedModel', `✓ Roughness map loaded for ${child.name}`)
                    }, 
                    undefined, 
                    (err) => console.error('Error loading roughness map', err)
                  )
                }

                // Apply scalar values immediately
                if (selectedOption.metalness !== undefined) stdMat.metalness = selectedOption.metalness
                if (selectedOption.roughness !== undefined) stdMat.roughness = selectedOption.roughness
                stdMat.needsUpdate = true
              }
            } else {
              // Fallback for non-standard materials (just clone for now)
              newMat = originalMat.clone()
            }
            
            // Cache and assign
            variantMaterialCache.set(cacheKey, newMat)
            child.material = newMat
          }
        }
      })
    })

    // Cleanup: dispose variant materials and textures when effect re-runs
    return () => {
      // Restore original materials
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial
        }
      })
      // Dispose loaded textures
      loadedTextures.forEach(tex => tex.dispose())
      // Dispose cached variant materials
      variantMaterialCache.forEach(mat => mat.dispose())
      variantMaterialCache.clear()
    }
  }, [configurableGroups, scene, isEditor])

  useEffect(() => {
    const overrides = config.meshMaterialOverrides
    if (!overrides || Object.keys(overrides).length === 0) return

    const textureLoader = new THREE.TextureLoader()
    const loadedTextures: THREE.Texture[] = []
    const overriddenMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()

    const applyTextureSettings = (texture: THREE.Texture, isSRGB: boolean) => {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(1, 1)
      texture.generateMipmaps = true
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.magFilter = THREE.LinearFilter
      if (isSRGB) {
        try { texture.colorSpace = THREE.SRGBColorSpace } catch { }
      } else {
        try { texture.colorSpace = THREE.NoColorSpace } catch { }
      }
      loadedTextures.push(texture)
    }

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || Array.isArray(child.material)) return
      const override = overrides[child.name]
      if (!override || !(child.material instanceof THREE.MeshStandardMaterial)) return

      overriddenMaterials.set(child, child.material)
      const nextMaterial = child.material.clone()

      if (override.color) nextMaterial.color.set(override.color)
      if (override.metalness !== undefined) nextMaterial.metalness = override.metalness
      if (override.roughness !== undefined) nextMaterial.roughness = override.roughness

      if (override.textureUrl !== undefined) {
        nextMaterial.map = null
        if (override.textureUrl) {
          textureLoader.load(override.textureUrl, (texture) => {
            applyTextureSettings(texture, true)
            nextMaterial.map = texture
            nextMaterial.needsUpdate = true
          })
        }
      }

      if (override.normalMapUrl !== undefined) {
        nextMaterial.normalMap = null
        if (override.normalMapUrl) {
          textureLoader.load(override.normalMapUrl, (texture) => {
            applyTextureSettings(texture, false)
            nextMaterial.normalMap = texture
            nextMaterial.needsUpdate = true
          })
        }
      }

      if (override.roughnessMapUrl !== undefined) {
        nextMaterial.roughnessMap = null
        if (override.roughnessMapUrl) {
          textureLoader.load(override.roughnessMapUrl, (texture) => {
            applyTextureSettings(texture, false)
            nextMaterial.roughnessMap = texture
            nextMaterial.needsUpdate = true
          })
        }
      }

      nextMaterial.needsUpdate = true
      child.material = nextMaterial
    })

    return () => {
      overriddenMaterials.forEach((material, mesh) => {
        if (mesh.material instanceof THREE.Material && mesh.material !== material) {
          mesh.material.dispose()
        }
        mesh.material = material
      })
      loadedTextures.forEach(texture => texture.dispose())
    }
  }, [config.meshMaterialOverrides, configurableGroups, scene])

  // Apply mesh transforms from config (for both Editor and Viewer)
  useEffect(() => {
    if (!config.meshTransforms) return
    
    log('LoadedModel', 'Applying mesh transforms', { count: Object.keys(config.meshTransforms).length })
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && config.meshTransforms?.[child.name]) {
        const transform = config.meshTransforms[child.name]
        
        // Only apply if values exist
        if (transform.position) child.position.fromArray(transform.position)
        if (transform.rotation) child.rotation.fromArray(transform.rotation)
        if (transform.scale) child.scale.fromArray(transform.scale)
        
        child.updateMatrix()
      }
    })
  }, [config.meshTransforms, scene])
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // Check drag distance to prevent selection after flying/orbiting
    const dist = Math.sqrt(
      Math.pow(e.clientX - pointerDownPos.current.x, 2) + 
      Math.pow(e.clientY - pointerDownPos.current.y, 2)
    )
    
    if (dist > 5) {
      log('LoadedModel', 'Click ignored due to drag', { dist })
      return
    }
    
    // Check global state directly to avoid closure staleness
    const isHotspotMode = useHotspotStore.getState().isHotspotMode
    
    // If in Hotspot Mode, DO NOT select the object.
    // The click will be handled by HotspotRenderer's global click listener.
    if (isEditor && isHotspotMode) {
      return
    }
    
    const clickedMesh = e.object as THREE.Mesh
    log('LoadedModel', 'Mesh clicked:', { 
      name: clickedMesh.name, 
      uuid: clickedMesh.uuid,
      isEditor
    })
    
    if (isEditor) {
      // Allow multi-selection with Shift or Ctrl keys
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey
      
      // Stop propagation to prevent selecting parent groups or other objects behind
      e.stopPropagation()

      // Directly select the clicked mesh
      // We removed the logic that forces selecting the Model (root) first
      // because users found it confusing and it prevented easy mesh selection.
      selectObject(clickedMesh, clickedMesh.uuid, clickedMesh.name, isMultiSelect)
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
      } else {
        // If no variant, dispatch generic model click for teleportation (handled in ViewerContent)
        window.dispatchEvent(new CustomEvent('model-click-teleport', {
          detail: { point: e.point }
        }))
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
      onPointerDown={handlePointerDown}
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
