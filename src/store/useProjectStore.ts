import { create } from 'zustand'
import { 
  ProjectConfig, 
  ModelConfig,
  defaultProjectConfig, 
  createDefaultProject,
  FullProjectData 
} from '@/types'
import { useSceneStore } from './useSceneStore'
import { useInteractionsStore } from './useInteractionsStore'
import { useVariantsStore } from './useVariantsStore'

// Debug logger
const DEBUG = true
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ProjectStore/${action}]`, data !== undefined ? data : '')
  }
}

// Generate unique ID
const generateId = () => `model_${Math.random().toString(36).substring(2, 11)}`

interface ProjectState {
  // Project Meta
  projectId: string | null
  projectName: string
  version: string
  defaultMode: 'viewer' | 'editor' | 'player'
  editorLock: boolean
  assets: {
    mainModel: string | null
    envMap: string | null
    models: ModelConfig[]
  }
  
  // Loading State
  isLoading: boolean
  projectExists: boolean
  error: string | null
  
  // Actions
  loadProject: (projectId: string) => Promise<boolean>
  createNewProject: (projectId: string, projectName: string) => void
  updateProjectName: (name: string) => void
  setMainModel: (url: string) => void
  setEnvMap: (url: string) => void
  
  // Multiple Model Actions
  addModel: (url: string, name?: string) => string
  updateModel: (id: string, updates: Partial<Omit<ModelConfig, 'id'>>) => void
  removeModel: (id: string) => void
  
  getFullProjectData: () => FullProjectData
  resetProject: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial State
  projectId: null,
  projectName: defaultProjectConfig.projectName,
  version: defaultProjectConfig.version,
  defaultMode: defaultProjectConfig.defaultMode,
  editorLock: defaultProjectConfig.editorLock,
  assets: { ...defaultProjectConfig.assets, models: [] },
  
  isLoading: false,
  projectExists: false,
  error: null,

  // Load project from server
  loadProject: async (projectId: string) => {
    log('loadProject', { projectId })
    set({ isLoading: true, error: null })
    
    try {
      // Try to fetch project.json from the data folder
      const response = await fetch(`/data/${projectId}/project.json`)
      
      if (!response.ok) {
        log('loadProject', 'Project not found, creating new')
        // Project doesn't exist
        set({ 
          isLoading: false, 
          projectExists: false,
          projectId 
        })
        return false
      }
      
      const projectData: ProjectConfig = await response.json()
      log('loadProject', { projectData })
      
      // Load other config files
      const [sceneRes, interactionsRes, variantsRes] = await Promise.all([
        fetch(`/data/${projectId}/scene.json`).catch(() => null),
        fetch(`/data/${projectId}/interactions.json`).catch(() => null),
        fetch(`/data/${projectId}/variants.json`).catch(() => null)
      ])
      
      // Convert relative model path to absolute path
      // e.g., "model/file.glb" -> "/data/projectId/model/file.glb"
      const assets = { ...projectData.assets }
      
      // Ensure models array exists for backward compatibility
      if (!assets.models) {
        assets.models = []
      }

      if (assets.mainModel && !assets.mainModel.startsWith('/') && !assets.mainModel.startsWith('blob:') && !assets.mainModel.startsWith('http')) {
        assets.mainModel = `/data/${projectId}/${assets.mainModel}`
        log('Converted model path', { original: projectData.assets.mainModel, resolved: assets.mainModel })
      }

      // Migration: If models is empty but mainModel exists, populate models
      if (assets.models.length === 0 && assets.mainModel) {
         assets.models.push({
          id: 'main-model',
          name: 'Main Model',
          url: assets.mainModel,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          visible: true
         })
      }
      
      // Update project store
      set({
        projectId: projectData.projectId,
        projectName: projectData.projectName,
        version: projectData.version,
        defaultMode: projectData.defaultMode,
        editorLock: projectData.editorLock,
        assets: assets,
        isLoading: false,
        projectExists: true
      })
      
      // Update scene store if scene.json exists
      if (sceneRes?.ok) {
        const sceneData = await sceneRes.json()
        useSceneStore.getState().loadFromConfig(sceneData)
      }
      
      // Update interactions store if interactions.json exists
      if (interactionsRes?.ok) {
        const interactionsData = await interactionsRes.json()
        useInteractionsStore.getState().loadFromConfig(interactionsData)
      }
      
      // Update variants store if variants.json exists
      if (variantsRes?.ok) {
        const variantsData = await variantsRes.json()
        useVariantsStore.getState().loadFromConfig(variantsData)
      }
      
      return true
    } catch (error) {
      console.error('Failed to load project:', error)
      set({ 
        isLoading: false, 
        projectExists: false,
        error: 'Proje yüklenirken hata oluştu',
        projectId
      })
      return false
    }
  },

  // Create new project with default values
  createNewProject: (projectId: string, projectName: string) => {
    const defaultData = createDefaultProject(projectId, projectName)
    
    set({
      projectId: defaultData.project.projectId,
      projectName: defaultData.project.projectName,
      version: defaultData.project.version,
      defaultMode: defaultData.project.defaultMode,
      editorLock: defaultData.project.editorLock,
      assets: defaultData.project.assets,
      projectExists: true,
      isLoading: false
    })
    
    // Initialize other stores with defaults
    useSceneStore.getState().loadFromConfig(defaultData.scene)
    useInteractionsStore.getState().loadFromConfig(defaultData.interactions)
    useVariantsStore.getState().loadFromConfig(defaultData.variants)
  },

  updateProjectName: (name: string) => {
    set({ projectName: name })
  },

  setMainModel: (url: string) => {
    set(state => ({
      assets: { ...state.assets, mainModel: url }
    }))
  },

  setEnvMap: (url: string) => {
    set(state => ({
      assets: { ...state.assets, envMap: url }
    }))
  },

  // Multiple Model Actions
  addModel: (url: string, name?: string) => {
    const id = generateId()
    const modelName = name || `Model ${get().assets.models.length + 1}`
    
    const newModel: ModelConfig = {
      id,
      name: modelName,
      url,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true
    }
    
    log('addModel', { id, url, name: modelName })
    
    set(state => {
      let currentModels = state.assets.models || []
      
      // Migration: If no models but mainModel exists, add it as the first model
      if (currentModels.length === 0 && state.assets.mainModel) {
        currentModels = [{
          id: 'main-model',
          name: 'Main Model',
          url: state.assets.mainModel,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          visible: true
        }]
      }

      return {
        assets: {
          ...state.assets,
          models: [...currentModels, newModel]
        }
      }
    })
    
    return id
  },

  updateModel: (id: string, updates: Partial<Omit<ModelConfig, 'id'>>) => {
    set(state => ({
      assets: {
        ...state.assets,
        models: state.assets.models.map(model =>
          model.id === id ? { ...model, ...updates } : model
        )
      }
    }))
  },

  removeModel: (id: string) => {
    log('removeModel', { id })
    set(state => ({
      assets: {
        ...state.assets,
        models: state.assets.models.filter(model => model.id !== id)
      }
    }))
  },

  // Get all project data for export
  getFullProjectData: (): FullProjectData => {
    const state = get()
    return {
      project: {
        projectId: state.projectId || 'unknown',
        projectName: state.projectName,
        version: state.version,
        defaultMode: state.defaultMode,
        editorLock: state.editorLock,
        assets: state.assets
      },
      scene: useSceneStore.getState().getConfig(),
      interactions: useInteractionsStore.getState().getConfig(),
      variants: useVariantsStore.getState().getConfig()
    }
  },

  resetProject: () => {
    set({
      projectId: null,
      projectName: defaultProjectConfig.projectName,
      version: defaultProjectConfig.version,
      defaultMode: defaultProjectConfig.defaultMode,
      editorLock: defaultProjectConfig.editorLock,
      assets: { ...defaultProjectConfig.assets },
      isLoading: false,
      projectExists: false,
      error: null
    })
  }
}))
