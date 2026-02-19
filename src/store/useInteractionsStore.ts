import { create } from 'zustand'
import {
  InteractionsConfig,
  InteractionZone,
  PopupContent
} from '@/types'
import { useHistoryStore } from '@/hooks/useHistory'
import { nanoid } from 'nanoid'

// Debug logger
const DEBUG = false
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[InteractionsStore/${action}]`, data !== undefined ? data : '')
  }
}

const generateId = () => `zone_${nanoid(10)}`

interface InteractionsState {
  zones: InteractionZone[]
  activeZoneId: string | null

  // Actions
  addZone: (position: [number, number, number]) => string
  updateZone: (id: string, updates: Partial<Omit<InteractionZone, 'id'>>) => void
  updateZonePopup: (id: string, popupUpdates: Partial<PopupContent>) => void
  removeZone: (id: string) => void
  setActiveZone: (id: string | null) => void

  // Config Management
  loadFromConfig: (config: InteractionsConfig) => void
  getConfig: () => InteractionsConfig
  reset: () => void
}

export const useInteractionsStore = create<InteractionsState>((set, get) => ({
  zones: [],
  activeZoneId: null,

  addZone: (position) => {
    const id = generateId()
    log('addZone', { id, position })

    const newZone: InteractionZone = {
      id,
      position,
      radius: 1.5,
      triggerType: 'proximity',
      popup: {
        title: 'Yeni Bilgi Noktası',
        blocks: [
          {
            id: 'block_welcome',
            type: 'text',
            content: 'Buraya açıklama yazın...',
            settings: {
              fontSize: 14,
              color: '#ffffff',
              textAlign: 'left'
            }
          }
        ],
        style: {
          backgroundColor: '#111618',
          textColor: '#ffffff',
          opacity: 0.95,
          padding: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          backdropBlur: 20,
          shadowSize: 'xl',
          maxWidth: 340,
          headerBg: 'rgba(255,255,255,0.05)'
        }
      }
    }

    log('addZone', { newZone })

    set(state => ({
      zones: [...state.zones, newZone],
      activeZoneId: id
    }))

    useHistoryStore.getState().pushAction({
      description: `Add interaction zone`,
      undo: () => set(state => ({
        zones: state.zones.filter(z => z.id !== id),
        activeZoneId: state.activeZoneId === id ? null : state.activeZoneId
      })),
      redo: () => set(state => ({
        zones: [...state.zones, newZone],
        activeZoneId: id
      }))
    })

    log('addZone', 'Zone added successfully, total zones: ' + (get().zones.length))
    return id
  },

  updateZone: (id, updates) => {
    const oldZone = get().zones.find(z => z.id === id)
    if (!oldZone) return
    const oldCopy = JSON.parse(JSON.stringify(oldZone))
    set(state => ({
      zones: state.zones.map(zone =>
        zone.id === id ? { ...zone, ...updates } : zone
      )
    }))
    const newCopy = JSON.parse(JSON.stringify(get().zones.find(z => z.id === id)))
    useHistoryStore.getState().pushAction({
      description: `Update zone ${id}`,
      undo: () => set(state => ({
        zones: state.zones.map(z => z.id === id ? oldCopy : z)
      })),
      redo: () => set(state => ({
        zones: state.zones.map(z => z.id === id ? newCopy : z)
      }))
    })
  },

  updateZonePopup: (id, popupUpdates) => {
    const oldZone = get().zones.find(z => z.id === id)
    if (!oldZone) return
    const oldPopup = JSON.parse(JSON.stringify(oldZone.popup))
    set(state => ({
      zones: state.zones.map(zone =>
        zone.id === id
          ? { ...zone, popup: { ...zone.popup, ...popupUpdates } }
          : zone
      )
    }))
    const newPopup = JSON.parse(JSON.stringify(get().zones.find(z => z.id === id)!.popup))
    useHistoryStore.getState().pushAction({
      description: `Update zone popup ${id}`,
      undo: () => set(state => ({
        zones: state.zones.map(z => z.id === id ? { ...z, popup: oldPopup } : z)
      })),
      redo: () => set(state => ({
        zones: state.zones.map(z => z.id === id ? { ...z, popup: newPopup } : z)
      }))
    })
  },

  removeZone: (id) => {
    const removedZone = get().zones.find(z => z.id === id)
    if (!removedZone) return
    const zoneCopy = JSON.parse(JSON.stringify(removedZone))
    set(state => ({
      zones: state.zones.filter(zone => zone.id !== id),
      activeZoneId: state.activeZoneId === id ? null : state.activeZoneId
    }))
    useHistoryStore.getState().pushAction({
      description: `Remove zone ${id}`,
      undo: () => set(state => ({ zones: [...state.zones, zoneCopy] })),
      redo: () => set(state => ({
        zones: state.zones.filter(z => z.id !== id),
        activeZoneId: state.activeZoneId === id ? null : state.activeZoneId
      }))
    })
  },

  setActiveZone: (id) => {
    set({ activeZoneId: id })
  },

  loadFromConfig: (config) => {
    set({ zones: config.zones, activeZoneId: null })
  },

  getConfig: (): InteractionsConfig => {
    return { zones: get().zones }
  },

  reset: () => {
    set({ zones: [], activeZoneId: null })
  }
}))
