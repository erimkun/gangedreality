import { create } from 'zustand'
import {
  InteractionsConfig,
  InteractionZone,
  PopupContent
} from '@/types'

// Debug logger
const DEBUG = true
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[InteractionsStore/${action}]`, data !== undefined ? data : '')
  }
}

const generateId = () => `zone_${Math.random().toString(36).substring(2, 11)}`

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

    log('addZone', 'Zone added successfully, total zones: ' + (get().zones.length))
    return id
  },

  updateZone: (id, updates) => {
    set(state => ({
      zones: state.zones.map(zone =>
        zone.id === id ? { ...zone, ...updates } : zone
      )
    }))
  },

  updateZonePopup: (id, popupUpdates) => {
    set(state => ({
      zones: state.zones.map(zone =>
        zone.id === id
          ? { ...zone, popup: { ...zone.popup, ...popupUpdates } }
          : zone
      )
    }))
  },

  removeZone: (id) => {
    set(state => ({
      zones: state.zones.filter(zone => zone.id !== id),
      activeZoneId: state.activeZoneId === id ? null : state.activeZoneId
    }))
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
