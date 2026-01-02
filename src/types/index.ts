// Type Definitions for the Project
// Based on Project.md specifications

// ============ MODEL CONFIG ============
export interface ModelConfig {
  id: string
  name: string
  url: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  visible: boolean
}

// ============ PROJECT.JSON ============
export interface ProjectConfig {
  projectId: string
  projectName: string
  version: string
  defaultMode: 'viewer' | 'editor' | 'player'
  editorLock: boolean
  assets: {
    mainModel: string | null
    envMap: string | null
    models: ModelConfig[] // Multiple model support
  }
}

// ============ SCENE.JSON ============
export interface EnvironmentConfig {
  hdri: string | null
  hdriPreset: 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby' | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse' | 'custom'
  customHdriUrl: string | null
  intensity: number
  rotation: number
  backgroundBlurriness: number
  backgroundIntensity?: number
  backgroundColor?: string
  showBackground: boolean

  // Global Lights
  ambientLight: {
    intensity: number
    color: string
  }
  hemisphereLight: {
    intensity: number
    skyColor: string
    groundColor: string
  }
}

export interface LightConfig {
  id: string
  type: 'directional' | 'point' | 'spot' | 'ambient'
  position: [number, number, number]
  target?: [number, number, number] // For directional and spot lights
  intensity: number
  color: string
  castShadow: boolean
  angle?: number // For spot lights (in radians)
  penumbra?: number // For spot lights
  distance?: number // For point and spot lights
  decay?: number // For point and spot lights

  // Shadow properties
  shadowBias?: number
  shadowMapSize?: number // 512, 1024, 2048, 4096
  shadowRadius?: number // For PCFSoftShadowMap
}

export interface PlayerConfig {
  startPosition: [number, number, number]
  startRotation: [number, number, number]
  moveSpeed: number
  eyeHeight: number
  collisionMeshIds?: string[] // Collision için seçilen mesh ID'leri
}

// Orbit kamera başlangıç ayarları
export interface CameraConfig {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

// ============ EFFECTS.JSON ============
export interface AOConfig {
  enabled: boolean
  intensity: number
  color: string
  radius: number
  distanceFalloff: number
  luminanceInfluence: number
  quality: 'low' | 'medium' | 'high' | 'ultra'
}

export interface BloomConfig {
  enabled: boolean
  intensity: number
  luminanceThreshold: number
  luminanceSmoothing: number
}

export interface VignetteConfig {
  enabled: boolean
  offset: number
  darkness: number
}

export interface ColorGradingConfig {
  enabled: boolean
  brightness: number
  contrast: number
  saturation: number
  hue: number
}

export interface EffectsConfig {
  ao?: AOConfig
  bloom?: BloomConfig
  vignette?: VignetteConfig
  colorGrading?: ColorGradingConfig
}

export const defaultEffectsConfig: EffectsConfig = {
  ao: {
    enabled: false,
    color: '#000000',
    intensity: 1.0,
    radius: 2.0,
    distanceFalloff: 1.0,
    luminanceInfluence: 0.1,
    quality: 'medium'
  },
  bloom: {
    enabled: false,
    intensity: 1.0,
    luminanceThreshold: 0.9,
    luminanceSmoothing: 0.025
  },
  vignette: {
    enabled: false,
    offset: 0.5,
    darkness: 0.5
  },
  colorGrading: {
    enabled: false,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0
  }
}

// ============ COMBINED SCENE CONFIG ============

export interface SceneConfig {
  environment: EnvironmentConfig
  lights: LightConfig[]
  player: PlayerConfig
  camera?: CameraConfig // Orbit view başlangıç kamerası
  effects?: EffectsConfig
}

// ============ INTERACTIONS.JSON ============
export interface PopupStyle {
  backgroundColor: string
  textColor: string
  opacity: number
  // Extended style options
  padding?: number // px
  borderRadius?: number // px
  borderWidth?: number // px
  borderColor?: string
  backdropBlur?: number // px
  shadowSize?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: number // px
  headerBg?: string // header background color
}

export type PopupBlockType = 'text' | 'image' | 'list' | 'divider' | 'icon'

export interface PopupBlock {
  id: string
  type: PopupBlockType
  content?: string // For text/image url
  settings: {
    // Text specific
    fontSize?: number
    textAlign?: 'left' | 'center' | 'right'
    color?: string

    // Image specific
    height?: number
    objectFit?: 'cover' | 'contain'

    // List specific
    items?: string[]
    listStyle?: 'bullet' | 'number' | 'icon'
    icon?: string // SVG path or name
    iconColor?: string

    // Divider specific
    thickness?: number
    dividerColor?: string
    margin?: number

    // Icon specific
    iconSize?: number
  }
}

export interface PopupContent {
  title: string
  blocks: PopupBlock[] // New Block System
  // Legacy fields (optional support or deprecated)
  content?: string
  mediaType?: 'image' | 'video' | 'none'
  mediaUrl?: string | null
  style: PopupStyle
}

export interface InteractionZone {
  id: string
  position: [number, number, number]
  radius: number
  triggerType: 'proximity' | 'click'
  popup: PopupContent
}

export interface InteractionsConfig {
  zones: InteractionZone[]
}

// ============ VARIANTS.JSON ============
export interface VariantOption {
  name: string
  type: 'color' | 'texture'
  value?: string // For color type
  textureUrl?: string // For texture type
  tiling?: [number, number]
  metalness?: number // For metallic materials (0-1)
  roughness?: number // For material roughness (0-1)
}

export interface ConfigurableGroup {
  id: string
  displayName: string
  icon: string | null
  targetMeshNames: string[]
  options: VariantOption[]
  defaultOptionIndex: number | null
  selectedOptionIndex: number | null // null = hiçbir seçenek seçili değil
}

export interface VariantsConfig {
  configurableGroups: ConfigurableGroup[]
}

// ============ COMBINED PROJECT DATA ============
export interface FullProjectData {
  project: ProjectConfig
  scene: SceneConfig
  interactions: InteractionsConfig
  variants: VariantsConfig
}

// ============ DEFAULT VALUES ============
export const defaultProjectConfig: ProjectConfig = {
  projectId: 'new',
  projectName: 'Yeni Proje',
  version: '1.0',
  defaultMode: 'viewer',
  editorLock: false,
  assets: {
    mainModel: null,
    envMap: null,
    models: []
  }
}

export const defaultSceneConfig: SceneConfig = {
  environment: {
    hdri: null,
    hdriPreset: 'apartment',
    customHdriUrl: null,
    intensity: 1.0,
    rotation: 0,
    backgroundBlurriness: 0.1,
    showBackground: false,
    ambientLight: {
      intensity: 0.5,
      color: '#ffffff'
    },
    hemisphereLight: {
      intensity: 0.5,
      skyColor: '#ffffff',
      groundColor: '#444444'
    }
  },
  lights: [
    {
      id: 'default_sun',
      type: 'directional',
      position: [10, 20, 10],
      intensity: 2.5,
      color: '#ffffee',
      castShadow: true
    }
  ],
  player: {
    startPosition: [0, 1.7, 5],
    startRotation: [0, 0, 0],
    moveSpeed: 2.0,
    eyeHeight: 1.7
  },
  camera: {
    position: [5, 5, 5],
    target: [0, 0, 0],
    fov: 50
  },
  effects: defaultEffectsConfig
}

export const defaultInteractionsConfig: InteractionsConfig = {
  zones: []
}

export const defaultVariantsConfig: VariantsConfig = {
  configurableGroups: []
}

export const createDefaultProject = (projectId: string, projectName: string): FullProjectData => ({
  project: {
    ...defaultProjectConfig,
    projectId,
    projectName
  },
  scene: defaultSceneConfig,
  interactions: defaultInteractionsConfig,
  variants: defaultVariantsConfig
})
