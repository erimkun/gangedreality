/// <reference types="vite/client" />

// Global window extensions
declare global {
  interface Window {
    __loadedTextures?: Map<string, File>
    __loadedModelFile?: File
    __loadedModelFiles?: File[]
    __blobUrlToFileName?: Map<string, string>
    __interactionFiles?: Map<string, File>
  }
}

export {}