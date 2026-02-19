import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { useHistoryStore } from '@/hooks/useHistory'
import type { HotspotShape, HotspotNode, HotspotSettings } from '@/types'

// Re-export types for backward compatibility
export type { HotspotShape, HotspotNode, HotspotSettings }

interface HotspotStore {
  nodes: HotspotNode[]
  settings: HotspotSettings
  isHotspotMode: boolean

  // Actions
  addNode: (position: [number, number, number]) => void
  removeNode: (id: string) => void
  updateNode: (id: string, data: Partial<HotspotNode>) => void
  updateSettings: (settings: Partial<HotspotSettings>) => void
  setHotspotMode: (enabled: boolean) => void
  setNodes: (nodes: HotspotNode[]) => void
  toggleWalkableMesh: (meshId: string) => void
  loadFromConfig: (config: { nodes?: HotspotNode[], settings?: HotspotSettings }) => void
}

export const useHotspotStore = create<HotspotStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      settings: {
        cursorColor: '#ffffff',
        cursorSize: 1,
        cursorOpacity: 0.8,
        defaultShape: 'circle',
        animationDuration: 1.0, // Faster default
        nodeColor: '#3b82f6',
        nodeHoverColor: '#60a5fa',
        walkableMeshIds: []
      },
      isHotspotMode: false,

      addNode: (position) => {
        const newNode: HotspotNode = {
          id: nanoid(),
          position,
          visible: true,
          label: `Nokta ${get().nodes.length + 1}`
        }

        set((state) => ({
          nodes: [...state.nodes, newNode]
        }))

        // Add to history
        useHistoryStore.getState().pushAction({
          description: 'Navigasyon noktası eklendi',
          undo: () => {
            set((state) => ({
              nodes: state.nodes.filter((n) => n.id !== newNode.id)
            }))
          },
          redo: () => {
            set((state) => ({
              nodes: [...state.nodes, newNode]
            }))
          }
        })
      },

      removeNode: (id) => {
        const nodeToRemove = get().nodes.find((n: HotspotNode) => n.id === id)
        if (!nodeToRemove) return

        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id)
        }))

        // Add to history
        useHistoryStore.getState().pushAction({
          description: 'Navigasyon noktası silindi',
          undo: () => {
            set((state) => ({
              nodes: [...state.nodes, nodeToRemove]
            }))
          },
          redo: () => {
            set((state) => ({
              nodes: state.nodes.filter((n) => n.id !== id)
            }))
          }
        })
      },

      updateNode: (id, data) => {
        const oldNode = get().nodes.find((n: HotspotNode) => n.id === id)
        if (!oldNode) return

        set((state) => ({
          nodes: state.nodes.map((n) => n.id === id ? { ...n, ...data } : n)
        }))

        // Add to history (debounce logic might be needed for continuous updates like dragging)
        // For now, we assume this is called on drag end or property change
        useHistoryStore.getState().pushAction({
          description: 'Navigasyon noktası güncellendi',
          undo: () => {
            set((state) => ({
              nodes: state.nodes.map((n) => n.id === id ? oldNode : n)
            }))
          },
          redo: () => {
            set((state) => ({
              nodes: state.nodes.map((n) => n.id === id ? { ...n, ...data } : n)
            }))
          }
        })
      },

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      setHotspotMode: (enabled) => set({ isHotspotMode: enabled }),

      setNodes: (nodes) => set({ nodes }),

      toggleWalkableMesh: (meshId) => set((state) => {
        const currentIds = state.settings.walkableMeshIds || []
        const exists = currentIds.includes(meshId)
        return {
          settings: {
            ...state.settings,
            walkableMeshIds: exists
              ? currentIds.filter(id => id !== meshId)
              : [...currentIds, meshId]
          }
        }
      }),

      loadFromConfig: (config) => set({
        nodes: config.nodes || [],
        settings: { ...get().settings, ...(config.settings || {}) },
      })
    }),
    {
      name: 'hotspot-storage',
      partialize: (state) => {
        // Sanitize function to remove blob URLs
        const sanitizeUrl = (url?: string) => {
          if (url && url.startsWith('blob:')) return undefined
          return url
        }

        return {
          nodes: state.nodes.map(node => ({
            ...node,
            customIconUrl: sanitizeUrl(node.customIconUrl)
          })),
          settings: {
            ...state.settings,
            defaultCustomIconUrl: sanitizeUrl(state.settings.defaultCustomIconUrl)
          }
        }
      },
      version: 1, // Force cleanup of old state to prevent "ghost nodes"
    }
  )
)
