import { useCallback, useEffect, useRef } from 'react'
import { create } from 'zustand'

// History entry type
interface HistoryEntry {
  id: string
  timestamp: number
  description: string
  undo: () => void
  redo: () => void
}

// History store
interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  canUndo: boolean
  canRedo: boolean
  
  // Actions
  pushAction: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  undo: () => void
  redo: () => void
  clear: () => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  pushAction: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now()
    }
    
    set(state => ({
      past: [...state.past.slice(-49), newEntry], // Keep max 50 entries
      future: [], // Clear redo stack on new action
      canUndo: true,
      canRedo: false
    }))
  },

  undo: () => {
    const { past, future } = get()
    if (past.length === 0) return

    const entry = past[past.length - 1]
    entry.undo()

    set({
      past: past.slice(0, -1),
      future: [entry, ...future],
      canUndo: past.length > 1,
      canRedo: true
    })
  },

  redo: () => {
    const { past, future } = get()
    if (future.length === 0) return

    const entry = future[0]
    entry.redo()

    set({
      past: [...past, entry],
      future: future.slice(1),
      canUndo: true,
      canRedo: future.length > 1
    })
  },

  clear: () => {
    set({
      past: [],
      future: [],
      canUndo: false,
      canRedo: false
    })
  }
}))

/**
 * Hook to create undoable actions
 */
export function useUndoable<T>(
  getValue: () => T,
  setValue: (value: T) => void,
  description: string
) {
  const previousValue = useRef<T | null>(null)

  const startChange = useCallback(() => {
    previousValue.current = getValue()
  }, [getValue])

  const endChange = useCallback(() => {
    if (previousValue.current === null) return
    
    const oldValue = previousValue.current
    const newValue = getValue()
    
    // Don't record if nothing changed
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return

    useHistoryStore.getState().pushAction({
      description,
      undo: () => setValue(oldValue),
      redo: () => setValue(newValue)
    })

    previousValue.current = null
  }, [getValue, setValue, description])

  return { startChange, endChange }
}

/**
 * Hook to enable keyboard shortcuts for undo/redo
 */
export function useUndoRedoKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const { undo, redo, canUndo, canRedo } = useHistoryStore.getState()

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey && canUndo) {
          e.preventDefault()
          undo()
        } else if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedo) {
          e.preventDefault()
          redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
