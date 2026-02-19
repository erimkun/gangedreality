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
import { useHotspotStore } from './useHotspotStore'

// Debug logger
const DEBUG = false
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ProjectStore/${action}]`, data !== undefined ? data : '')
  }
}

// Generate unique ID
const generateId = () => `model_${Math.random().toString(36).substring(2, 11)}`

const resetGlobalAssetMaps = () => {
  const win = window as any
  win.__loadedModelFile = undefined
  win.__loadedModelFiles = []
  win.__loadedTextures = new Map()
  win.__blobUrlToFileName = new Map()
  win.__dataUrlToFileName = new Map()
  win.__interactionFiles = new Map()
}

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

// Load version counter to prevent race conditions
let _loadVersion = 0

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
    const thisLoad = ++_loadVersion
    log('loadProject', { projectId, loadVersion: thisLoad })
    set({ isLoading: true, error: null })

    resetGlobalAssetMaps()

    try {
      // Try to fetch project.json from the data folder
      const response = await fetch(`/data/${projectId}/project.json`)

      // Stale check: another loadProject was called while we were fetching
      if (thisLoad !== _loadVersion) return false

      // Check both status and content-type — SPA fallback may return index.html with 200
      const contentType = response.headers.get('content-type') || ''
      if (!response.ok || !contentType.includes('application/json')) {
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

      const defaultData = createDefaultProject(projectId, projectData.projectName)

      // Load other config files
      const [sceneRes, interactionsRes, variantsRes, hotspotsRes] = await Promise.all([
        fetch(`/data/${projectId}/scene.json`).catch((e) => { log('loadProject', `scene.json fetch failed: ${e.message}`); return null }),
        fetch(`/data/${projectId}/interactions.json`).catch((e) => { log('loadProject', `interactions.json fetch failed: ${e.message}`); return null }),
        fetch(`/data/${projectId}/variants.json`).catch((e) => { log('loadProject', `variants.json fetch failed: ${e.message}`); return null }),
        fetch(`/data/${projectId}/hotspots.json`).catch((e) => { log('loadProject', `hotspots.json fetch failed: ${e.message}`); return null })
      ])

      // Stale check: another loadProject was called while we were fetching configs
      if (thisLoad !== _loadVersion) return false

      // Convert relative model path to absolute path
      // e.g., "model/file.glb" -> "/data/projectId/model/file.glb"
      const assets = {
        ...projectData.assets,
        // Deep-clone models array to avoid mutating the original projectData
        models: projectData.assets.models
          ? projectData.assets.models.map(m => ({ ...m }))
          : []
      }

      if (assets.mainModel && !assets.mainModel.startsWith('/') && !assets.mainModel.startsWith('blob:') && !assets.mainModel.startsWith('http')) {
        assets.mainModel = `/data/${projectId}/${assets.mainModel}`
        log('Converted model path', { original: projectData.assets.mainModel, resolved: assets.mainModel })
      }

      // Resolve relative paths for all models in the models array
      if (assets.models && assets.models.length > 0) {
        assets.models.forEach(model => {
          if (model.url && !model.url.startsWith('/') && !model.url.startsWith('blob:') && !model.url.startsWith('http')) {
            const originalUrl = model.url
            model.url = `/data/${projectId}/${model.url}`
            log('Converted sub-model path', { original: originalUrl, resolved: model.url })
          }
        })
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

        // Resolve custom HDRI path
        if (sceneData.environment && sceneData.environment.customHdriUrl) {
          const url = sceneData.environment.customHdriUrl
          if (!url.startsWith('/') && !url.startsWith('http') && !url.startsWith('blob:')) {
            sceneData.environment.customHdriUrl = `/data/${projectId}/${url}`
          }
        }

        useSceneStore.getState().loadFromConfig(sceneData)
      } else {
        useSceneStore.getState().loadFromConfig(defaultData.scene)
      }

      // Update interactions store if interactions.json exists
      if (interactionsRes?.ok) {
        const interactionsData = await interactionsRes.json()

        // Resolve relative paths in interactions (images, etc)
        if (interactionsData.zones) {
          interactionsData.zones.forEach((zone: any) => {
            // Resolve popup header mediaUrl
            if (zone.popup?.mediaUrl && !zone.popup.mediaUrl.startsWith('/') && !zone.popup.mediaUrl.startsWith('http') && !zone.popup.mediaUrl.startsWith('blob:')) {
              zone.popup.mediaUrl = `/data/${projectId}/${zone.popup.mediaUrl}`
            }

            // Resolve block images
            if (zone.popup?.blocks) {
              zone.popup.blocks.forEach((block: any) => {
                if (block.type === 'image' && block.content && !block.content.startsWith('/') && !block.content.startsWith('http') && !block.content.startsWith('blob:')) {
                  block.content = `/data/${projectId}/${block.content}`
                }
              })
            }
          })
        }

        useInteractionsStore.getState().loadFromConfig(interactionsData)
      } else {
        useInteractionsStore.getState().loadFromConfig(defaultData.interactions)
      }

      // Update variants store if variants.json exists
      if (variantsRes?.ok) {
        const variantsData = await variantsRes.json()

        // Resolve relative paths in variants
        if (variantsData.configurableGroups) {
          variantsData.configurableGroups.forEach((group: any) => {
            if (group.options) {
              group.options.forEach((option: any) => {
                // Helper to resolve url
                const resolveUrl = (url: string | undefined) => {
                  if (url && !url.startsWith('/') && !url.startsWith('http') && !url.startsWith('blob:')) {
                    return `/data/${projectId}/${url}`
                  }
                  return url
                }

                option.textureUrl = resolveUrl(option.textureUrl)
                option.normalMapUrl = resolveUrl(option.normalMapUrl)
                option.roughnessMapUrl = resolveUrl(option.roughnessMapUrl)
              })
            }
          })
        }

        useVariantsStore.getState().loadFromConfig(variantsData)
      } else {
        useVariantsStore.getState().loadFromConfig(defaultData.variants)
      }

      // Update hotspots store if hotspots.json exists
      if (hotspotsRes?.ok) {
        try {
          const hotspotsData = await hotspotsRes.json()

          // Resolve custom icons in nodes
          if (hotspotsData.settings && hotspotsData.settings.defaultCustomIconUrl) {
            const url = hotspotsData.settings.defaultCustomIconUrl
            if (!url.startsWith('/') && !url.startsWith('http') && !url.startsWith('blob:')) {
              hotspotsData.settings.defaultCustomIconUrl = `/data/${projectId}/${url}`
            }
          }

          if (hotspotsData.nodes) {
            hotspotsData.nodes.forEach((node: any) => {
              if (node.customIconUrl && !node.customIconUrl.startsWith('/') && !node.customIconUrl.startsWith('http') && !node.customIconUrl.startsWith('blob:')) {
                node.customIconUrl = `/data/${projectId}/${node.customIconUrl}`
              }
            })
          }

          // Resolve default custom icon
          if (hotspotsData.settings && hotspotsData.settings.defaultCustomIconUrl) {
            const url = hotspotsData.settings.defaultCustomIconUrl
            if (url && !url.startsWith('/') && !url.startsWith('http') && !url.startsWith('blob:')) {
              hotspotsData.settings.defaultCustomIconUrl = `/data/${projectId}/${url}`
            }
          }

          useHotspotStore.getState().setNodes(hotspotsData.nodes || [])
          useHotspotStore.getState().updateSettings(hotspotsData.settings || {})
        } catch (e) {
          console.warn('Failed to parse hotspots.json', e)
          useHotspotStore.getState().loadFromConfig(defaultData.hotspots)
        }
      } else {
        useHotspotStore.getState().loadFromConfig(defaultData.hotspots)
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

    resetGlobalAssetMaps()

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
    useHotspotStore.getState().loadFromConfig(defaultData.hotspots)
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
    // Revoke blob URL if model used one
    const model = get().assets.models.find(m => m.id === id)
    if (model?.url && model.url.startsWith('blob:')) {
      URL.revokeObjectURL(model.url)
    }
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
      variants: useVariantsStore.getState().getConfig(),
      hotspots: {
        nodes: useHotspotStore.getState().nodes,
        settings: useHotspotStore.getState().settings
      }
    }
  },

  resetProject: () => {
    resetGlobalAssetMaps()
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

    // Reset all other stores
    const defaultData = createDefaultProject('temp', 'temp')
    useSceneStore.getState().loadFromConfig(defaultData.scene)
    useInteractionsStore.getState().loadFromConfig(defaultData.interactions)
    useVariantsStore.getState().loadFromConfig(defaultData.variants)
    useHotspotStore.getState().loadFromConfig(defaultData.hotspots)
  }
}))
