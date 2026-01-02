declare module 'n8ao' {
  import * as THREE from 'three'
  import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'
  
  export class N8AOPostPass extends Pass {
    constructor(scene: THREE.Scene, camera: THREE.Camera, width: number, height: number)
    
    configuration: {
      aoRadius: number
      intensity: number
      distanceFalloff: number
      color: THREE.Color
      screenSpaceRadius: boolean
      aoSamples: number
      denoiseSamples: number
      denoiseRadius: number
    }
    
    setDisplayMode(mode: 'Combined' | 'AO' | 'No AO' | 'Split' | 'Split AO'): void
    setSize(width: number, height: number): void
    dispose(): void
  }
}
