/// <reference types="vite/client" />

// Global window extensions
declare global {
  interface Window {
    __loadedTextures?: Map<string, File>
    __loadedModelFile?: File
  }
}

export {}