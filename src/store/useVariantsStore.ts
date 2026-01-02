import { create } from 'zustand'
import { 
  VariantsConfig, 
  ConfigurableGroup, 
  VariantOption
} from '@/types'

const generateId = () => `group_${Math.random().toString(36).substring(2, 11)}`

interface VariantsState {
  configurableGroups: ConfigurableGroup[]
  activeGroupId: string | null
  
  // Actions - Groups
  createGroup: (displayName: string, meshNames: string[]) => string
  updateGroup: (id: string, updates: Partial<Omit<ConfigurableGroup, 'id' | 'options'>>) => void
  removeGroup: (id: string) => void
  setActiveGroup: (id: string | null) => void
  
  // Actions - Options
  addOption: (groupId: string, option: VariantOption) => void
  updateOption: (groupId: string, optionIndex: number, updates: Partial<VariantOption>) => void
  removeOption: (groupId: string, optionIndex: number) => void
  selectOption: (groupId: string, optionIndex: number) => void
  
  // Actions - Mesh Management
  addMeshToGroup: (groupId: string, meshName: string) => void
  removeMeshFromGroup: (groupId: string, meshName: string) => void
  
  // Config Management
  loadFromConfig: (config: VariantsConfig) => void
  getConfig: () => VariantsConfig
  reset: () => void
}

export const useVariantsStore = create<VariantsState>((set, get) => ({
  configurableGroups: [],
  activeGroupId: null,

  // Group Actions
  createGroup: (displayName, meshNames) => {
    const id = generateId()
    const newGroup: ConfigurableGroup = {
      id,
      displayName,
      icon: null,
      targetMeshNames: meshNames,
      options: [],
      defaultOptionIndex: null,
      selectedOptionIndex: null // Başlangıçta hiçbir seçenek seçili değil
    }
    
    set(state => ({
      configurableGroups: [...state.configurableGroups, newGroup],
      activeGroupId: id
    }))
    
    return id
  },

  updateGroup: (id, updates) => {
    set(state => ({
      configurableGroups: state.configurableGroups.map(group =>
        group.id === id ? { ...group, ...updates } : group
      )
    }))
  },

  removeGroup: (id) => {
    set(state => ({
      configurableGroups: state.configurableGroups.filter(g => g.id !== id),
      activeGroupId: state.activeGroupId === id ? null : state.activeGroupId
    }))
  },

  setActiveGroup: (id) => {
    set({ activeGroupId: id })
  },

  // Option Actions
  addOption: (groupId, option) => {
    set(state => ({
      configurableGroups: state.configurableGroups.map(group =>
        group.id === groupId
          ? { ...group, options: [...group.options, option] }
          : group
      )
    }))
  },

  updateOption: (groupId, optionIndex, updates) => {
    set(state => ({
      configurableGroups: state.configurableGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((opt, idx) =>
                idx === optionIndex ? { ...opt, ...updates } : opt
              )
            }
          : group
      )
    }))
  },

  removeOption: (groupId, optionIndex) => {
    set(state => ({
      configurableGroups: state.configurableGroups.map(group =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.filter((_, idx) => idx !== optionIndex),
              selectedOptionIndex: 
                group.selectedOptionIndex !== null && group.selectedOptionIndex >= optionIndex && group.selectedOptionIndex > 0
                  ? group.selectedOptionIndex - 1
                  : group.selectedOptionIndex
            }
          : group
      )
    }))
  },

  selectOption: (groupId, optionIndex) => {
    set(state => ({
      configurableGroups: state.configurableGroups.map(group =>
        group.id === groupId
          ? { ...group, selectedOptionIndex: optionIndex }
          : group
      )
    }))
  },

  // Mesh Management
  addMeshToGroup: (groupId, meshName) => {
    set(state => ({
      configurableGroups: state.configurableGroups.map(group =>
        group.id === groupId && !group.targetMeshNames.includes(meshName)
          ? { ...group, targetMeshNames: [...group.targetMeshNames, meshName] }
          : group
      )
    }))
  },

  removeMeshFromGroup: (groupId, meshName) => {
    set(state => ({
      configurableGroups: state.configurableGroups.map(group =>
        group.id === groupId
          ? { ...group, targetMeshNames: group.targetMeshNames.filter(n => n !== meshName) }
          : group
      )
    }))
  },

  // Config Management
  loadFromConfig: (config) => {
    // Eski projelerde selectedOptionIndex: 0 olabilir, null'a çevir
    const groups = config.configurableGroups.map(group => ({
      ...group,
      selectedOptionIndex: null // Başlangıçta hiçbir seçenek seçili değil
    }))
    
    set({ 
      configurableGroups: groups,
      activeGroupId: null 
    })
  },

  getConfig: (): VariantsConfig => {
    return { configurableGroups: get().configurableGroups }
  },

  reset: () => {
    set({ configurableGroups: [], activeGroupId: null })
  }
}))
