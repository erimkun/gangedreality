import { create } from 'zustand'
import {
  SceneConfig,
  EnvironmentConfig,
  LightConfig,
  PlayerConfig,
  CameraConfig,
  EffectsConfig,
  defaultSceneConfig
} from '../types'

// Generate simple UUID without external library
const generateId = () => Math.random().toString(36).substring(2, 11)

interface SceneStore extends SceneConfig {
  // Environment Actions
  updateEnvironment: (config: Partial<EnvironmentConfig>) => void

  // Light Actions
  addLight: (type: LightConfig['type']) => string
  updateLight: (id: string, config: Partial<LightConfig>) => void
  removeLight: (id: string) => void

  // Player Actions
  updatePlayer: (config: Partial<PlayerConfig>) => void

  // Camera Actions
  updateCamera: (config: Partial<CameraConfig>) => void

  // Effects Actions
  updateEffects: (config: Partial<EffectsConfig> | ((prev: EffectsConfig) => Partial<EffectsConfig>)) => void

  // Mesh Actions
  addDeletedMesh: (id: string) => void

  // General Actions
  loadFromConfig: (config: SceneConfig) => void
  getConfig: () => SceneConfig
  reset: () => void
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  ...defaultSceneConfig,

  updateEnvironment: (config) => set((state) => ({
    environment: { ...state.environment, ...config }
  })),

  addLight: (type) => {
    const id = `light_${generateId()}`
    const defaultPositions: Record<string, [number, number, number]> = {
      directional: [10, 20, 10],
      point: [0, 3, 0],
      spot: [0, 5, 0],
      ambient: [0, 0, 0]
    }

    const newLight: LightConfig = {
      id,
      type,
      position: defaultPositions[type] || [0, 5, 0],
      intensity: type === 'ambient' ? 0.5 : 1.5,
      color: '#ffffff',
      castShadow: type !== 'ambient'
    }

    set((state) => ({
      lights: [...state.lights, newLight]
    }))
    return id
  },

  updateLight: (id, config) => set((state) => ({
    lights: state.lights.map((light) =>
      light.id === id ? { ...light, ...config } : light
    )
  })),

  removeLight: (id) => set((state) => ({
    lights: state.lights.filter((light) => light.id !== id)
  })),

  updatePlayer: (config) => set((state) => ({
    player: { ...state.player, ...config }
  })),

  updateCamera: (config) => set((state) => ({
    camera: state.camera ? { ...state.camera, ...config } : { ...defaultSceneConfig.camera!, ...config }
  })),

  updateEffects: (config) => set((state) => {
    const currentEffects = state.effects || defaultSceneConfig.effects!
    const newEffects = typeof config === 'function' ? config(currentEffects) : config

    // Deep merge for nested config like 'ao'
    return {
      effects: {
        ...currentEffects,
        ...newEffects,
        ao: newEffects.ao ? { ...currentEffects.ao, ...newEffects.ao } : currentEffects.ao
      }
    }
  }),

  addDeletedMesh: (id) => set((state) => ({
    deletedMeshIds: [...(state.deletedMeshIds || []), id]
  })),

  loadFromConfig: (config) => set(() => ({
    ...config,
    // Ensure defaults if missing in loaded config
    effects: config.effects || defaultSceneConfig.effects,
    deletedMeshIds: config.deletedMeshIds || []
  })),

  getConfig: () => {
    const state = get()
    return {
      environment: state.environment,
      lights: state.lights,
      player: state.player,
      camera: state.camera,
      effects: state.effects,
      deletedMeshIds: state.deletedMeshIds || []
    }
  },

  reset: () => set(() => ({
    ...defaultSceneConfig
  }))
}))
