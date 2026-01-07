/**
 * Panel components barrel export
 * All editor panels are organized here for clean imports
 */

// Main Panels
export { default as LightsPanel } from './LightsPanel'
export { default as PropertiesPanel } from './PropertiesPanel'
export { default as PlayerSettingsPanel } from './PlayerSettingsPanel'
export { default as InteractionsPanel } from './InteractionsPanel'
export { default as VariantsPanel } from './VariantsPanel'
export { default as EffectsPanel } from './EffectsPanel'
export { default as HotspotPanel } from './HotspotPanel'

// Shared UI Components
export * from './shared'

// Re-export utility components from panels
export { SliderInput, ToggleSwitch, CollapsibleSection } from './shared'
export { ColorInput, PositionInput } from './LightsPanel'
