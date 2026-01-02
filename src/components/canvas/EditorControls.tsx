import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { TransformControls } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '@/store/useEditorStore'
import { useSceneStore } from '@/store/useSceneStore'
import { useInteractionsStore } from '@/store/useInteractionsStore'
import { useHistoryStore } from '@/hooks/useHistory'

// Debug logger
const DEBUG = false
const log = (message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[EditorControls]`, message, data !== undefined ? data : '')
  }
}

export default function EditorControls() {
  const { 
    selectedObject, 
    selectedObjects,
    selectedObjectId, 
    selectedObjectIds,
    activeTool, 
    transformSpace,
    setGizmoActive
  } = useEditorStore()
  const { updateLight } = useSceneStore()
  const { updateZone } = useInteractionsStore()
  const { pushAction } = useHistoryStore()
  const transformRef = useRef<any>(null)
  const { gl, scene, controls } = useThree()
  
  // Store transform state before drag for undo
  const preDragStateRef = useRef<{
    position: THREE.Vector3
    rotation: THREE.Euler
    scale: THREE.Vector3
    objectId: string | null
  } | null>(null)
  
  // Track if we're in multi-select mode
  const isMultiSelect = selectedObjects.length > 1
  
  // Group for multi-select transforms
  const multiSelectGroupRef = useRef<THREE.Group | null>(null)
  const [multiSelectGroup, setMultiSelectGroup] = useState<THREE.Group | null>(null)
  
  // Store original positions relative to group center
  const originalOffsetsRef = useRef<Map<string, THREE.Vector3>>(new Map())
  const isDraggingRef = useRef(false)
  
  // Calculate center point of all selected objects
  const pivotCenter = useMemo(() => {
    if (selectedObjects.length === 0) return new THREE.Vector3()
    
    const center = new THREE.Vector3()
    selectedObjects.forEach(obj => {
      center.add(obj.position.clone())
    })
    center.divideScalar(selectedObjects.length)
    return center
  }, [selectedObjects])
  
  // Create/update multi-select group when selection changes
  useEffect(() => {
    // Cleanup previous group
    if (multiSelectGroupRef.current) {
      scene.remove(multiSelectGroupRef.current)
      multiSelectGroupRef.current = null
      setMultiSelectGroup(null)
    }
    
    if (!isMultiSelect || selectedObjects.length === 0) return
    
    // Create a new group at the center
    const group = new THREE.Group()
    group.name = '__multiSelectGroup__'
    group.position.copy(pivotCenter)
    
    // Store original offsets from center for each object
    originalOffsetsRef.current.clear()
    selectedObjects.forEach((obj, idx) => {
      const id = selectedObjectIds[idx]
      const offset = obj.position.clone().sub(pivotCenter)
      originalOffsetsRef.current.set(id, offset)
    })
    
    scene.add(group)
    multiSelectGroupRef.current = group
    setMultiSelectGroup(group)
    
    log('Multi-select group created', { 
      center: pivotCenter.toArray(), 
      count: selectedObjects.length 
    })
    
    return () => {
      if (multiSelectGroupRef.current) {
        scene.remove(multiSelectGroupRef.current)
        multiSelectGroupRef.current = null
      }
    }
  }, [isMultiSelect, selectedObjects, selectedObjectIds, pivotCenter, scene])
  
  // Determine what type of object is selected
  const getObjectType = useCallback((objId: string) => {
    if (!objId) return null
    
    if (objId.startsWith('light_')) return 'light'
    if (objId.startsWith('zone_')) return 'zone'
    return 'mesh'
  }, [])

  // Apply group transform to all selected objects
  const syncGroupToObjects = useCallback(() => {
    if (!multiSelectGroupRef.current || !isMultiSelect) return
    
    const group = multiSelectGroupRef.current
    
    selectedObjects.forEach((obj, idx) => {
      const id = selectedObjectIds[idx]
      const offset = originalOffsetsRef.current.get(id)
      if (!offset) return
      
      // Apply group's transform to the offset
      const newOffset = offset.clone()
      
      // Apply rotation if in rotate mode
      if (activeTool === 'rotate') {
        newOffset.applyQuaternion(group.quaternion)
      }
      
      // Apply scale if in scale mode
      if (activeTool === 'scale') {
        newOffset.multiply(group.scale)
      }
      
      // Calculate new position
      const newPos = group.position.clone().add(newOffset)
      obj.position.copy(newPos)
      
      // Apply rotation to object itself (if rotating)
      if (activeTool === 'rotate') {
        // For rotation, we also rotate the object itself
        // This is optional - comment out if you only want position change
      }
      
      // Update stores
      const objectType = getObjectType(id)
      const position = obj.position.toArray() as [number, number, number]
      
      if (objectType === 'light') {
        updateLight(id, { position })
      } else if (objectType === 'zone') {
        updateZone(id, { position })
      }
    })
  }, [isMultiSelect, selectedObjects, selectedObjectIds, activeTool, getObjectType, updateLight, updateZone])

  // Handle transform changes for multi-select
  const handleMultiTransformChange = useCallback(() => {
    if (!multiSelectGroupRef.current || !isMultiSelect) return
    
    syncGroupToObjects()
    
    // Update the offsets after drag ends so next drag starts from current positions
    const group = multiSelectGroupRef.current
    originalOffsetsRef.current.clear()
    selectedObjects.forEach((obj, idx) => {
      const id = selectedObjectIds[idx]
      const offset = obj.position.clone().sub(group.position)
      originalOffsetsRef.current.set(id, offset)
    })
    
    log('Multi-select transform complete')
  }, [isMultiSelect, selectedObjects, selectedObjectIds, syncGroupToObjects])

  // Handle transform changes - sync with stores (single object)
  const handleTransformChange = useCallback(() => {
    if (!selectedObject || !selectedObjectId) return
    
    const position = selectedObject.position.toArray() as [number, number, number]
    const objectType = getObjectType(selectedObjectId)
    
    switch (objectType) {
      case 'light':
        updateLight(selectedObjectId, { position })
        break
      case 'zone':
        const scale = selectedObject.scale.x // Uniform scale = radius
        updateZone(selectedObjectId, { position, radius: scale })
        break
      case 'mesh':
        log('Mesh transform:', { 
          id: selectedObjectId, 
          position,
          rotation: selectedObject.rotation.toArray().slice(0, 3),
          scale: selectedObject.scale.toArray()
        })
        break
    }
  }, [selectedObject, selectedObjectId, getObjectType, updateLight, updateZone])
  
  // Keyboard shortcuts for tool switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const { 
        setActiveTool, 
        toggleTransformSpace, 
        clearSelection,
        selectAll,
        focusOnSelection,
        toggleOutliner
      } = useEditorStore.getState()
      
      switch (e.key.toLowerCase()) {
        case 'g': // Grab/Move
        case 'w':
          if (!e.ctrlKey) {
            log('Tool change: translate')
            setActiveTool('translate')
          }
          break
        case 'e': // Rotate
          log('Tool change: rotate')
          setActiveTool('rotate')
          break
        case 'r': // Scale (R key)
        case 's': // Scale (only if not ctrl+s for save)
          if (!e.ctrlKey) {
            log('Tool change: scale')
            setActiveTool('scale')
          }
          break
        case 'q': // Toggle local/world space
          log('Toggle transform space')
          toggleTransformSpace()
          break
        case 'escape':
          log('Clear selection')
          clearSelection()
          break
        case 'a': // Select All
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            log('Select all triggered')
            selectAll()
          }
          break
        case 'f': // Focus on selection
          log('Focus on selection')
          focusOnSelection()
          break
        case 'h': // Toggle outliner
          log('Toggle outliner')
          toggleOutliner()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // CRITICAL: Capture phase listener to detect gizmo interaction BEFORE OrbitControls
  useEffect(() => {
    if (!transformRef.current || !gl.domElement) return
    
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    
    const handlePointerDown = (event: PointerEvent) => {
      // Calculate mouse position
      const rect = gl.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      // Check if we clicked on the gizmo
      // TransformControls has a gizmo property with children we can raycast against
      const transformControls = transformRef.current
      if (transformControls && transformControls._gizmo) {
        const gizmo = transformControls._gizmo
        const picker = gizmo.picker?.[activeTool] || gizmo.gizmo?.[activeTool]
        
        if (picker) {
          // Get all gizmo meshes for raycasting
          const gizmoMeshes: THREE.Object3D[] = []
          picker.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              gizmoMeshes.push(child)
            }
          })
          
          // Get camera from three context
          const camera = transformControls.camera
          if (camera && gizmoMeshes.length > 0) {
            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(gizmoMeshes, true)
            
            if (intersects.length > 0) {
              // Clicked on gizmo - IMMEDIATELY disable OrbitControls
              log('Gizmo clicked - disabling OrbitControls')
              setGizmoActive(true)
              if (controls) {
                (controls as any).enabled = false
              }
            }
          }
        }
      }
    }
    
    // Use capture phase to fire BEFORE OrbitControls
    gl.domElement.addEventListener('pointerdown', handlePointerDown, { capture: true })
    
    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown, { capture: true })
    }
  }, [gl, controls, activeTool, setGizmoActive])
  
  // Sync group position to objects during drag AND control gizmo active state
  useFrame(() => {
    if (isDraggingRef.current && multiSelectGroupRef.current && isMultiSelect) {
      syncGroupToObjects()
    }
    
    // Update gizmo active state when hovering over gizmo axis
    if (transformRef.current) {
      const gizmoHovered = transformRef.current.axis !== null
      const gizmoDragging = isDraggingRef.current
      const shouldBeActive = gizmoHovered || gizmoDragging
      
      // Use store to control OrbitControls from outside
      const currentState = useEditorStore.getState().isGizmoActive
      if (shouldBeActive !== currentState) {
        setGizmoActive(shouldBeActive)
      }
    }
  })
  
  // Handle dragging state - start/end for undo/redo
  useEffect(() => {
    if (!transformRef.current) return
    
    const transformControls = transformRef.current
    
    const handleDragging = (event: { value: boolean }) => {
      const isDragStart = event.value
      const isDragEnd = !event.value
      
      isDraggingRef.current = isDragStart
      gl.domElement.style.cursor = isDragStart ? 'grabbing' : 'auto'
      
      // IMMEDIATELY set gizmo active state when drag starts/ends
      setGizmoActive(isDragStart)
      
      // Store state at drag start for undo
      if (isDragStart && selectedObject && selectedObjectId) {
        preDragStateRef.current = {
          position: selectedObject.position.clone(),
          rotation: selectedObject.rotation.clone(),
          scale: selectedObject.scale.clone(),
          objectId: selectedObjectId
        }
        log('Drag started, saved state for undo')
      }
      
      // On drag end, push action to history
      if (isDragEnd && preDragStateRef.current && selectedObject && selectedObjectId) {
        const preState = preDragStateRef.current
        const postPosition = selectedObject.position.clone()
        const postRotation = selectedObject.rotation.clone()
        const postScale = selectedObject.scale.clone()
        const objectId = selectedObjectId
        const objectRef = selectedObject
        
        // Only push to history if something actually changed
        const posChanged = !preState.position.equals(postPosition)
        const rotChanged = preState.rotation.x !== postRotation.x || 
                          preState.rotation.y !== postRotation.y || 
                          preState.rotation.z !== postRotation.z
        const scaleChanged = !preState.scale.equals(postScale)
        
        if (posChanged || rotChanged || scaleChanged) {
          pushAction({
            description: `Transform ${objectId}`,
            undo: () => {
              objectRef.position.copy(preState.position)
              objectRef.rotation.copy(preState.rotation)
              objectRef.scale.copy(preState.scale)
              // Update stores
              const objectType = getObjectType(objectId)
              const pos = preState.position.toArray() as [number, number, number]
              if (objectType === 'light') {
                updateLight(objectId, { position: pos })
              } else if (objectType === 'zone') {
                updateZone(objectId, { position: pos, radius: preState.scale.x })
              }
              log('Undo transform')
            },
            redo: () => {
              objectRef.position.copy(postPosition)
              objectRef.rotation.copy(postRotation)
              objectRef.scale.copy(postScale)
              // Update stores
              const objectType = getObjectType(objectId)
              const pos = postPosition.toArray() as [number, number, number]
              if (objectType === 'light') {
                updateLight(objectId, { position: pos })
              } else if (objectType === 'zone') {
                updateZone(objectId, { position: pos, radius: postScale.x })
              }
              log('Redo transform')
            }
          })
          log('Transform action pushed to history')
        }
        
        preDragStateRef.current = null
      }
      
      // When drag ends, update offsets for multi-select
      if (isDragEnd && isMultiSelect) {
        handleMultiTransformChange()
      }
    }
    
    // Add dragging-changed event listener
    transformControls.addEventListener('dragging-changed', handleDragging)
    
    return () => {
      transformControls.removeEventListener('dragging-changed', handleDragging)
      gl.domElement.style.cursor = 'auto'
      // Ensure OrbitControls are re-enabled on cleanup
      if (controls) {
        (controls as any).enabled = true
      }
    }
  }, [gl, controls, isMultiSelect, handleMultiTransformChange, selectedObject, selectedObjectId, getObjectType, updateLight, updateZone, pushAction])
  
  if (selectedObjects.length === 0) return null
  
  // Multi-select: use TransformControls on the group
  if (isMultiSelect && multiSelectGroup) {
    return (
      <TransformControls
        ref={transformRef}
        object={multiSelectGroup}
        mode={activeTool}
        space={transformSpace}
        onMouseUp={handleMultiTransformChange}
        size={0.75}
        showX
        showY
        showZ
      />
    )
  }
  
  // Single select: use TransformControls
  if (!isMultiSelect && selectedObject) {
    return (
      <TransformControls
        ref={transformRef}
        object={selectedObject}
        mode={activeTool}
        space={transformSpace}
        onMouseUp={handleTransformChange}
        size={0.75}
        showX
        showY
        showZ
      />
    )
  }
  
  return null
}
