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
import { useHistoryStore } from '@/hooks/useHistory'

import { nanoid } from 'nanoid'

// Generate unique ID
const generateId = () => nanoid(10)

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
  removeDeletedMesh: (id: string) => void

  // General Actions
  loadFromConfig: (config: SceneConfig) => void
  getConfig: () => SceneConfig
  reset: () => void
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  ...defaultSceneConfig,

  updateEnvironment: (config) => {
    const oldEnv = { ...get().environment }
    set((state) => ({
      environment: { ...state.environment, ...config }
    }))
    const newEnv = { ...get().environment }
    useHistoryStore.getState().pushAction({
      description: 'Update environment',
      undo: () => set({ environment: oldEnv }),
      redo: () => set({ environment: newEnv })
    })
  },

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
    useHistoryStore.getState().pushAction({
      description: `Add ${type} light`,
      undo: () => set((state) => ({ lights: state.lights.filter(l => l.id !== id) })),
      redo: () => set((state) => ({ lights: [...state.lights, newLight] }))
    })
    return id
  },

  updateLight: (id, config) => {
    const oldLight = get().lights.find(l => l.id === id)
    if (!oldLight) return
    const oldConfig = { ...oldLight }
    set((state) => ({
      lights: state.lights.map((light) =>
        light.id === id ? { ...light, ...config } : light
      )
    }))
    const newConfig = { ...get().lights.find(l => l.id === id)! }
    useHistoryStore.getState().pushAction({
      description: `Update light ${id}`,
      undo: () => set((state) => ({
        lights: state.lights.map(l => l.id === id ? oldConfig : l)
      })),
      redo: () => set((state) => ({
        lights: state.lights.map(l => l.id === id ? newConfig : l)
      }))
    })
  },

  removeLight: (id) => {
    const removedLight = get().lights.find(l => l.id === id)
    if (!removedLight) return
    const lightCopy = { ...removedLight }
    set((state) => ({
      lights: state.lights.filter((light) => light.id !== id)
    }))
    useHistoryStore.getState().pushAction({
      description: `Remove light ${id}`,
      undo: () => set((state) => ({ lights: [...state.lights, lightCopy] })),
      redo: () => set((state) => ({ lights: state.lights.filter(l => l.id !== id) }))
    })
  },

  updatePlayer: (config) => set((state) => ({
    player: { ...state.player, ...config }
  })),

  updateCamera: (config) => set((state) => ({
    camera: state.camera ? { ...state.camera, ...config } : { ...defaultSceneConfig.camera!, ...config }
  })),

  updateEffects: (config) => {
    const oldEffects = JSON.parse(JSON.stringify(get().effects || defaultSceneConfig.effects!))
    set((state) => {
      const currentEffects = state.effects || defaultSceneConfig.effects!
      const newEffects = typeof config === 'function' ? config(currentEffects) : config

      // Deep merge for all nested configs (ao, bloom, vignette, colorGrading)
      const merged: any = { ...currentEffects, ...newEffects }
      for (const key of Object.keys(newEffects) as (keyof EffectsConfig)[]) {
        const val = newEffects[key]
        if (val && typeof val === 'object' && !Array.isArray(val) && (currentEffects as any)[key]) {
          merged[key] = { ...(currentEffects as any)[key], ...val }
        }
      }
      return { effects: merged }
    })
    const newEffectsSnapshot = JSON.parse(JSON.stringify(get().effects))
    useHistoryStore.getState().pushAction({
      description: 'Update effects',
      undo: () => set({ effects: oldEffects }),
      redo: () => set({ effects: newEffectsSnapshot })
    })
  },

  addDeletedMesh: (id) => set((state) => {
    const existing = state.deletedMeshIds || []
    if (existing.includes(id)) return {}
    return { deletedMeshIds: [...existing, id] }
  }),

  removeDeletedMesh: (id) => set((state) => ({
    deletedMeshIds: (state.deletedMeshIds || []).filter(existingId => existingId !== id)
  })),

  loadFromConfig: (config) => set(() => ({
    ...config,
    // Ensure defaults if missing in loaded config
    player: config.player || defaultSceneConfig.player,
    camera: config.camera || defaultSceneConfig.camera,
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
