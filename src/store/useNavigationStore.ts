import { create } from 'zustand'

interface NavigationStore {
  isNavigating: boolean
  setIsNavigating: (value: boolean) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  isNavigating: false,
  setIsNavigating: (value) => set({ isNavigating: value })
}))
