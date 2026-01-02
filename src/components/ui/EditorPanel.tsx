/**
 * EditorPanel - Main editor sidebar container
 * 
 * This component serves as a shell/container for all editor panels.
 * Each panel is imported from src/components/ui/panels/ for clean SPA architecture.
 * 
 * Panel Structure:
 * - PropertiesPanel: Object transform and selection
 * - LightsPanel: Lighting configuration
 * - PlayerSettingsPanel: Player spawn and movement
 * - InteractionsPanel: Interactive zones and popups
 * - VariantsPanel: Material variants
 */

import { useEditorStore } from '../../store/useEditorStore'
import {
  PropertiesPanel,
  LightsPanel,
  PlayerSettingsPanel,
  InteractionsPanel,
  VariantsPanel,
  EffectsPanel,
  PanelTab
} from './panels'

// ============================================
// Panel Configuration
// ============================================

interface PanelConfig {
  id: 'properties' | 'lights' | 'player' | 'interactions' | 'variants' | 'effects'
  label: string
  icon: string
  component: React.ComponentType
}

const panelConfigs: PanelConfig[] = [
  { id: 'properties', label: 'Özellikler', icon: '📋', component: PropertiesPanel },
  { id: 'lights', label: 'Işıklar', icon: '💡', component: LightsPanel },
  { id: 'player', label: 'Oyuncu', icon: '🚶', component: PlayerSettingsPanel },
  { id: 'interactions', label: 'Noktalar', icon: '📍', component: InteractionsPanel },
  { id: 'variants', label: 'Varyant', icon: '🎨', component: VariantsPanel },
  { id: 'effects', label: 'Efektler', icon: '✨', component: EffectsPanel },
]

// ============================================
// Main Component
// ============================================

export default function EditorPanel() {
  const {
    isPropertiesPanelOpen,
    activePanel,
    setActivePanel
  } = useEditorStore()

  if (!isPropertiesPanelOpen) return null

  // Find active panel component
  const ActivePanelComponent = panelConfigs.find(p => p.id === activePanel)?.component || PropertiesPanel

  return (
    <div className="absolute right-4 top-20 bottom-20 w-80 bg-editor-panel/95 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col overflow-hidden">
      {/* Panel Tabs */}
      <div className="flex border-b border-gray-700">
        {panelConfigs.map(panel => (
          <PanelTab
            key={panel.id}
            label={panel.label}
            icon={panel.icon}
            active={activePanel === panel.id}
            onClick={() => setActivePanel(panel.id)}
          />
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ActivePanelComponent />
      </div>
    </div>
  )
}
