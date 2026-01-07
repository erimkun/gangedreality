import { create } from 'zustand'
import * as THREE from 'three'
import { useSceneStore } from './useSceneStore'

// Debug logger
const DEBUG = false
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[EditorStore/${action}]`, data !== undefined ? data : '')
  }
}

type TransformMode = 'translate' | 'rotate' | 'scale'

// Mesh info for outliner
interface MeshInfo {
  id: string
  name: string
  object: THREE.Object3D
  visible: boolean
  type: 'mesh' | 'light' | 'zone' | 'group'
  parentId?: string
}

interface EditorState {
  // Selection (supports multi-select)
  selectedObjects: THREE.Object3D[]
  selectedObjectIds: string[]
  selectedMeshNames: string[]
  
  // For backward compatibility
  selectedObject: THREE.Object3D | null
  selectedObjectId: string | null
  selectedMeshName: string | null
  
  // Scene mesh registry (for outliner)
  sceneMeshes: MeshInfo[]
  hiddenMeshIds: Set<string>
  
  // Transform Tools
  activeTool: TransformMode
  transformSpace: 'world' | 'local'
  
  // UI State
  isPropertiesPanelOpen: boolean
  isOutlinerOpen: boolean
  activePanel: 'properties' | 'lights' | 'player' | 'interactions' | 'variants' | 'effects' | 'hotspots' | 'outliner' | null
  
  // Focus target for camera
  focusTarget: THREE.Vector3 | null
  
  // Gizmo active state (to disable OrbitControls)
  isGizmoActive: boolean
  
  // Actions
  selectObject: (object: THREE.Object3D | null, id?: string, meshName?: string, addToSelection?: boolean) => void
  selectMultipleObjects: (objects: THREE.Object3D[], ids: string[], names: string[]) => void
  selectAll: () => void
  clearSelection: () => void
  
  // Mesh registry actions
  registerMesh: (mesh: MeshInfo) => void
  registerMeshes: (meshes: MeshInfo[]) => void
  unregisterMesh: (id: string) => void
  clearMeshRegistry: () => void
  toggleMeshVisibility: (id: string) => void
  setMeshVisibility: (id: string, visible: boolean) => void
  
  // Object Management
  deleteObject: (id: string) => void

  // Focus
  focusOnSelection: () => void
  setFocusTarget: (target: THREE.Vector3 | null) => void
  
  setActiveTool: (tool: TransformMode) => void
  toggleTransformSpace: () => void
  setActivePanel: (panel: EditorState['activePanel']) => void
  setGizmoActive: (active: boolean) => void
  togglePropertiesPanel: () => void
  toggleOutliner: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial State
  selectedObjects: [],
  selectedObjectIds: [],
  selectedMeshNames: [],
  
  selectedObject: null,
  selectedObjectId: null,
  selectedMeshName: null,
  
  sceneMeshes: [],
  hiddenMeshIds: new Set(),
  
  activeTool: 'translate',
  transformSpace: 'world',
  
  isPropertiesPanelOpen: true,
  isOutlinerOpen: false,
  activePanel: 'properties',
  
  focusTarget: null,
  
  isGizmoActive: false,

  // Selection Actions
  selectObject: (object, id, meshName, addToSelection = false) => {
    log('selectObject', { id, meshName, addToSelection, hasObject: !!object })
    
    if (!object) {
      log('selectObject', 'Clearing selection')
      set({
        selectedObjects: [],
        selectedObjectIds: [],
        selectedMeshNames: [],
        selectedObject: null,
        selectedObjectId: null,
        selectedMeshName: null
      })
      return
    }
    
    const state = get()
    const objId = id || object.uuid
    const objName = meshName || object.name || 'Unnamed'
    
    if (addToSelection) {
      // Toggle selection if already selected
      if (state.selectedObjectIds.includes(objId)) {
        const idx = state.selectedObjectIds.indexOf(objId)
        const newObjects = [...state.selectedObjects]
        const newIds = [...state.selectedObjectIds]
        const newNames = [...state.selectedMeshNames]
        newObjects.splice(idx, 1)
        newIds.splice(idx, 1)
        newNames.splice(idx, 1)
        
        set({
          selectedObjects: newObjects,
          selectedObjectIds: newIds,
          selectedMeshNames: newNames,
          selectedObject: newObjects[0] || null,
          selectedObjectId: newIds[0] || null,
          selectedMeshName: newNames[0] || null
        })
      } else {
        set({
          selectedObjects: [...state.selectedObjects, object],
          selectedObjectIds: [...state.selectedObjectIds, objId],
          selectedMeshNames: [...state.selectedMeshNames, objName],
          selectedObject: object,
          selectedObjectId: objId,
          selectedMeshName: objName
        })
      }
    } else {
      set({
        selectedObjects: [object],
        selectedObjectIds: [objId],
        selectedMeshNames: [objName],
        selectedObject: object,
        selectedObjectId: objId,
        selectedMeshName: objName,
        activePanel: 'properties'
      })
    }
  },

  selectMultipleObjects: (objects, ids, names) => {
    set({
      selectedObjects: objects,
      selectedObjectIds: ids,
      selectedMeshNames: names,
      selectedObject: objects[0] || null,
      selectedObjectId: ids[0] || null,
      selectedMeshName: names[0] || null
    })
  },

  selectAll: () => {
    const state = get()
    const visibleMeshes = state.sceneMeshes.filter(m => !state.hiddenMeshIds.has(m.id))
    log('selectAll', { 
      totalMeshes: state.sceneMeshes.length, 
      visibleMeshes: visibleMeshes.length 
    })
    
    set({
      selectedObjects: visibleMeshes.map(m => m.object),
      selectedObjectIds: visibleMeshes.map(m => m.id),
      selectedMeshNames: visibleMeshes.map(m => m.name),
      selectedObject: visibleMeshes[0]?.object || null,
      selectedObjectId: visibleMeshes[0]?.id || null,
      selectedMeshName: visibleMeshes[0]?.name || null
    })
  },

  clearSelection: () => {
    set({
      selectedObjects: [],
      selectedObjectIds: [],
      selectedMeshNames: [],
      selectedObject: null,
      selectedObjectId: null,
      selectedMeshName: null
    })
  },

  // Mesh registry
  registerMesh: (mesh) => {
    log('registerMesh', { id: mesh.id, name: mesh.name, type: mesh.type })
    set(state => {
      const newMeshes = [...state.sceneMeshes.filter(m => m.id !== mesh.id), mesh]
      log('registerMesh', `Total meshes now: ${newMeshes.length}`)
      return { sceneMeshes: newMeshes }
    })
  },

  registerMeshes: (meshes) => {
    log('registerMeshes', { count: meshes.length })
    set(state => {
      // Filter out existing meshes that are being re-registered
      const newIds = new Set(meshes.map(m => m.id))
      const existingMeshes = state.sceneMeshes.filter(m => !newIds.has(m.id))
      return { sceneMeshes: [...existingMeshes, ...meshes] }
    })
  },

  unregisterMesh: (id) => {
    log('unregisterMesh', { id })
    set(state => ({
      sceneMeshes: state.sceneMeshes.filter(m => m.id !== id)
    }))
  },

  clearMeshRegistry: () => {
    log('clearMeshRegistry', 'Clearing all meshes')
    set({ sceneMeshes: [] })
  },

  toggleMeshVisibility: (id) => {
    const state = get()
    const mesh = state.sceneMeshes.find(m => m.id === id)
    if (mesh) {
      const newHidden = new Set(state.hiddenMeshIds)
      const willBeHidden = !newHidden.has(id)
      log('toggleMeshVisibility', { id, name: mesh.name, willBeHidden })
      
      if (newHidden.has(id)) {
        newHidden.delete(id)
        mesh.object.visible = true
      } else {
        newHidden.add(id)
        mesh.object.visible = false
      }
      set({ hiddenMeshIds: newHidden })
    }
  },

  setMeshVisibility: (id, visible) => {
    const state = get()
    const mesh = state.sceneMeshes.find(m => m.id === id)
    if (mesh) {
      const newHidden = new Set(state.hiddenMeshIds)
      if (visible) {
        newHidden.delete(id)
      } else {
        newHidden.add(id)
      }
      mesh.object.visible = visible
      set({ hiddenMeshIds: newHidden })
    }
  },

  deleteObject: (id) => {
    const state = get()
    const meshInfo = state.sceneMeshes.find(m => m.id === id)
    
    if (meshInfo && meshInfo.object) {
      log('deleteObject', { id, name: meshInfo.name })
      
      // Remove from parent
      if (meshInfo.object.parent) {
        meshInfo.object.parent.remove(meshInfo.object)
      }
      
      // Dispose resources
      if (meshInfo.object instanceof THREE.Mesh) {
        if (meshInfo.object.geometry) {
          meshInfo.object.geometry.dispose()
        }
        if (meshInfo.object.material) {
          if (Array.isArray(meshInfo.object.material)) {
            meshInfo.object.material.forEach((m: any) => m.dispose())
          } else {
            (meshInfo.object.material as any).dispose()
          }
        }
      }
      
      // Update selection if needed
      if (state.selectedObjectIds.includes(id)) {
        const newSelectedIds = state.selectedObjectIds.filter(sid => sid !== id)
        const newSelectedObjects = state.selectedObjects.filter(obj => obj.uuid !== id)
        const newSelectedNames = state.selectedMeshNames.filter((_, idx) => state.selectedObjectIds[idx] !== id)
        
        set({
          selectedObjectIds: newSelectedIds,
          selectedObjects: newSelectedObjects,
          selectedMeshNames: newSelectedNames,
          // Update legacy single selection if needed
          selectedObject: newSelectedObjects.length > 0 ? newSelectedObjects[newSelectedObjects.length - 1] : null,
          selectedObjectId: newSelectedIds.length > 0 ? newSelectedIds[newSelectedIds.length - 1] : null,
          selectedMeshName: newSelectedNames.length > 0 ? newSelectedNames[newSelectedNames.length - 1] : null
        })
      }
      
      // Remove from registry
      get().unregisterMesh(id)

      // Add to deleted meshes in SceneStore (for persistence)
      // Use name if available for persistence across reloads, fall back to ID
      useSceneStore.getState().addDeletedMesh(meshInfo.name || id)
    }
  },

  // Focus
  focusOnSelection: () => {
    const state = get()
    if (state.selectedObjects.length > 0) {
      // Calculate world bounding box center of all selected objects
      const box = new THREE.Box3()
      const objectBox = new THREE.Box3()
      
      state.selectedObjects.forEach(obj => {
        // Ensure manual update of world matrix for accuracy
        obj.updateMatrixWorld()
        
        // If object has geometry, use it
        if ((obj as THREE.Mesh).geometry) {
           objectBox.setFromObject(obj)
        } else {
           // Fallback for lights/groups without geometry
           const worldPos = new THREE.Vector3()
           obj.getWorldPosition(worldPos)
           objectBox.setFromCenterAndSize(worldPos, new THREE.Vector3(1,1,1))
        }
        
        if (!objectBox.isEmpty()) {
            box.union(objectBox)
        }
      })
      
      if (!box.isEmpty()) {
          const center = new THREE.Vector3()
          box.getCenter(center)
          set({ focusTarget: center })
      } else {
          // Fallback to average position if bounding box fails
          const center = new THREE.Vector3()
          state.selectedObjects.forEach(obj => {
             const worldPos = new THREE.Vector3()
             obj.getWorldPosition(worldPos)
             center.add(worldPos)
          })
          center.divideScalar(state.selectedObjects.length)
          set({ focusTarget: center })
      }
    }
  },

  setFocusTarget: (target) => {
    set({ focusTarget: target })
  },

  // Transform Actions
  setActiveTool: (tool) => {
    set({ activeTool: tool })
  },

  toggleTransformSpace: () => {
    set(state => ({
      transformSpace: state.transformSpace === 'world' ? 'local' : 'world'
    }))
  },

  // Panel Actions
  setActivePanel: (panel) => {
    set({ activePanel: panel, isPropertiesPanelOpen: panel !== null })
  },

  togglePropertiesPanel: () => {
    set(state => ({
      isPropertiesPanelOpen: !state.isPropertiesPanelOpen
    }))
  },

  toggleOutliner: () => {
    set(state => ({
      isOutlinerOpen: !state.isOutlinerOpen
    }))
  },
  
  // Gizmo active control (for disabling OrbitControls)
  setGizmoActive: (active) => {
    set({ isGizmoActive: active })
  }
}))
