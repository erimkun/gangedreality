import { useState, useCallback } from 'react'
import { useSceneStore } from '@/store/useSceneStore'
import { useEditorStore } from '@/store/useEditorStore'
import { LightConfig } from '@/types'
import { SliderInput, CollapsibleSection } from './shared'

// Color Input with hex display
interface ColorInputProps {
  label: string
  value: string
  onChange: (color: string) => void
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-600"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 bg-editor-bg border border-gray-600 rounded px-2 py-1 text-white text-xs font-mono focus:border-blue-400 focus:outline-none"
        />
      </div>
    </div>
  )
}

// Position Input (X, Y, Z)
interface PositionInputProps {
  label: string
  value: [number, number, number]
  onChange: (position: [number, number, number]) => void
}

function PositionInput({ label, value, onChange }: PositionInputProps) {
  const colors = ['text-red-400', 'text-green-400', 'text-blue-400']
  const labels = ['X', 'Y', 'Z']

  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <label className={`text-[10px] ${colors[i]} block mb-0.5`}>{labels[i]}</label>
            <input
              type="number"
              step="0.5"
              value={value[i].toFixed(2)}
              onChange={(e) => {
                const newPos = [...value] as [number, number, number]
                newPos[i] = parseFloat(e.target.value) || 0
                onChange(newPos)
              }}
              className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1 text-white text-xs focus:border-blue-400 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Light Type Icons
const lightIcons: Record<string, string> = {
  directional: '☀️',
  point: '💡',
  spot: '🔦',
  ambient: '🌫️'
}

const lightColors: Record<string, string> = {
  directional: 'yellow',
  point: 'orange',
  spot: 'purple',
  ambient: 'cyan'
}

// Individual Light Editor
interface LightEditorProps {
  light: LightConfig
  onUpdate: (updates: Partial<LightConfig>) => void
  onDelete: () => void
  onSelect: () => void
  isSelected: boolean
}

function LightEditor({ light, onUpdate, onDelete, onSelect, isSelected }: LightEditorProps) {
  const [isOpen, setIsOpen] = useState(isSelected)

  const borderColor = lightColors[light.type] || 'blue'
  const borderClasses: Record<string, string> = {
    yellow: 'border-yellow-500/30',
    orange: 'border-orange-500/30',
    purple: 'border-purple-500/30',
    cyan: 'border-cyan-500/30'
  }
  const textClasses: Record<string, string> = {
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400'
  }

  return (
    <div className={`bg-editor-bg rounded-lg border ${borderClasses[borderColor]} ${isSelected ? 'ring-2 ring-white/50' : ''}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          <span className="text-lg">{lightIcons[light.type]}</span>
          <div>
            <span className={`${textClasses[borderColor]} font-medium text-sm`}>
              {light.type.charAt(0).toUpperCase() + light.type.slice(1)} Light
            </span>
            <p className="text-[10px] text-gray-500 font-mono">{light.id.slice(0, 12)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
            title="Sil"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-700/50 pt-3">
          {/* Common Properties */}
          <ColorInput
            label="Renk"
            value={light.color}
            onChange={(color) => onUpdate({ color })}
          />

          <SliderInput
            label="Şiddet (Intensity)"
            value={light.intensity}
            min={0}
            max={10}
            step={0.1}
            onChange={(intensity) => onUpdate({ intensity })}
            color={borderColor}
          />

          {/* Position (not for ambient) */}
          {light.type !== 'ambient' && (
            <PositionInput
              label="Pozisyon"
              value={light.position}
              onChange={(position) => onUpdate({ position })}
            />
          )}

          {/* Target (for directional and spot) */}
          {(light.type === 'directional' || light.type === 'spot') && (
            <PositionInput
              label="Hedef (Target)"
              value={light.target || [0, 0, 0]}
              onChange={(target) => onUpdate({ target })}
            />
          )}

          {/* Spot Light specific */}
          {light.type === 'spot' && (
            <>
              <SliderInput
                label="Açı (Angle)"
                value={(light.angle || Math.PI / 6) * (180 / Math.PI)}
                min={1}
                max={90}
                step={1}
                onChange={(angle) => onUpdate({ angle: angle * (Math.PI / 180) })}
                color="purple"
                unit="°"
              />
              <SliderInput
                label="Penumbra"
                value={light.penumbra || 0}
                min={0}
                max={1}
                step={0.05}
                onChange={(penumbra) => onUpdate({ penumbra })}
                color="purple"
              />
            </>
          )}

          {/* Point/Spot Light specific */}
          {(light.type === 'point' || light.type === 'spot') && (
            <>
              <SliderInput
                label="Mesafe (Distance)"
                value={light.distance || 0}
                min={0}
                max={100}
                step={1}
                onChange={(distance) => onUpdate({ distance })}
                color={borderColor}
              />
              <SliderInput
                label="Azalma (Decay)"
                value={light.decay || 2}
                min={0}
                max={5}
                step={0.1}
                onChange={(decay) => onUpdate({ decay })}
                color={borderColor}
              />
            </>
          )}

          {/* Shadow Settings (not for ambient) */}
          {light.type !== 'ambient' && (
            <CollapsibleSection
              title="Gölge Ayarları"
              icon="🌑"
              borderColor="blue"
            >
              <div className="pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Gölge Etkin</label>
                  <input
                    type="checkbox"
                    checked={light.castShadow}
                    onChange={(e) => onUpdate({ castShadow: e.target.checked })}
                    className="w-4 h-4 accent-blue-500"
                  />
                </div>

                {light.castShadow && (
                  <>
                    <SliderInput
                      label="Bias"
                      value={(light.shadowBias || -0.0001) * 10000}
                      min={-10}
                      max={10}
                      step={0.1}
                      onChange={(bias) => onUpdate({ shadowBias: bias / 10000 })}
                      color="blue"
                    />
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Shadow Map Boyutu</label>
                      <select
                        value={light.shadowMapSize || 1024}
                        onChange={(e) => onUpdate({ shadowMapSize: parseInt(e.target.value) })}
                        className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:border-blue-400 focus:outline-none"
                      >
                        <option value={512}>512 (Düşük)</option>
                        <option value={1024}>1024 (Orta)</option>
                        <option value={2048}>2048 (Yüksek)</option>
                        <option value={4096}>4096 (Ultra)</option>
                      </select>
                    </div>
                    <SliderInput
                      label="Blur Radius"
                      value={light.shadowRadius || 1}
                      min={0}
                      max={10}
                      step={0.5}
                      onChange={(shadowRadius) => onUpdate({ shadowRadius })}
                      color="blue"
                    />
                  </>
                )}
              </div>
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  )
}

// HDRI Preset Options
const hdriPresets = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'city', label: 'City' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'forest', label: 'Forest' },
  { value: 'lobby', label: 'Lobby' },
  { value: 'night', label: 'Night' },
  { value: 'park', label: 'Park' },
  { value: 'studio', label: 'Studio' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'custom', label: 'Özel HDRI' },
] as const

// Main Lights Panel
export default function LightsPanel() {
  const { lights, addLight, removeLight, updateLight, environment, updateEnvironment } = useSceneStore()
  const { selectedObjectId } = useEditorStore()

  const handleAddLight = useCallback((type: LightConfig['type']) => {
    const id = addLight(type)
    // Auto-select new light
    setTimeout(() => {
      // We can't select the 3D object here, but we can track the ID
    }, 100)
    return id
  }, [addLight])

  return (
    <div className="space-y-4">
      {/* Global Lights Section */}
      <CollapsibleSection
        title="Global Işıklar"
        icon="🌍"
        borderColor="blue"
        defaultOpen={true}
      >
        <div className="pt-3 space-y-4">
          {/* HDRI Environment */}
          <div className="space-y-2 p-2 bg-editor-panel/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🌄</span>
              <span className="text-white text-sm font-medium">HDRI Environment</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400">Preset</label>
              <select
                value={environment.hdriPreset || 'apartment'}
                onChange={(e) => updateEnvironment({ hdriPreset: e.target.value as typeof environment.hdriPreset })}
                className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                {hdriPresets.map((preset) => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>

            {environment.hdriPreset === 'custom' && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Panorama (.hdr / .jpg / .png / .webp)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={environment.customHdriUrl || ''}
                    readOnly
                    placeholder="Dosya seçin..."
                    className="flex-1 bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm focus:border-blue-400 focus:outline-none opacity-50 cursor-not-allowed"
                  />
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-1.5 text-xs flex items-center justify-center transition-colors">
                    <span>Yükle</span>
                    <input
                      type="file"
                      accept=".hdr,.exr,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const rawUrl = URL.createObjectURL(file)
                          // Append extension to URL hash so loaders can identify type
                          const extension = file.name.split('.').pop()
                          const url = `${rawUrl}#.${extension}`

                          // Store for export
                          const win = window as any
                          if (!win.__loadedTextures) win.__loadedTextures = new Map()
                          // Use a unique name for export
                          const fileName = `hdri_${Date.now()}_${file.name}`
                          win.__loadedTextures.set(fileName, file)

                          // Map blob to filename for export reference
                          if (!win.__blobUrlToFileName) win.__blobUrlToFileName = new Map()
                          // Store both versions just in case
                          win.__blobUrlToFileName.set(rawUrl, `textures/${fileName}`)
                          win.__blobUrlToFileName.set(url, `textures/${fileName}`)

                          updateEnvironment({ customHdriUrl: url })
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            <SliderInput
              label="Environment Intensity"
              value={environment.intensity || 1}
              min={0}
              max={3}
              step={0.1}
              onChange={(intensity) => updateEnvironment({ intensity })}
              color="green"
            />

            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Arka Plan Olarak Göster</label>
              <input
                type="checkbox"
                checked={environment.showBackground || false}
                onChange={(e) => updateEnvironment({ showBackground: e.target.checked })}
                className="w-4 h-4 accent-blue-500"
              />
            </div>

            {/* Background Mode Selection (Infinite vs Sphere) */}
            {environment.customHdriUrl && (
              <div className="pt-2 border-t border-gray-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Arka Plan Modu</label>
                  <div className="flex bg-black/20 rounded p-0.5 border border-gray-700">
                    <button
                      onClick={() => updateEnvironment({ backgroundType: 'infinite', showBackground: true })}
                      className={`px-2 py-1 text-[10px] rounded ${environment.backgroundType !== 'sphere' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Infinite
                    </button>
                    <button
                      onClick={() => updateEnvironment({ backgroundType: 'sphere', showBackground: false })} // Hide env background when using sphere
                      className={`px-2 py-1 text-[10px] rounded ${environment.backgroundType === 'sphere' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Sphere
                    </button>
                  </div>
                </div>

                {environment.backgroundType === 'sphere' && (
                  <div className="space-y-2 animate-fade-in pl-2 border-l-2 border-blue-500/20">
                    <PositionInput
                      label="Küre Pozisyonu"
                      value={environment.spherePosition || [0, 0, 0]}
                      onChange={(val) => updateEnvironment({ spherePosition: val })}
                    />
                    <SliderInput
                      label="Küre Boyutu"
                      value={environment.sphereScale || 100}
                      min={10}
                      max={1000}
                      step={10}
                      onChange={(val) => updateEnvironment({ sphereScale: val })}
                      color="blue"
                    />
                    <SliderInput
                      label="Küre Rotasyonu (Y)"
                      value={(environment.sphereRotation || 0) * 180 / Math.PI}
                      min={0}
                      max={360}
                      step={1}
                      unit="°"
                      onChange={(val) => updateEnvironment({ sphereRotation: val * Math.PI / 180 })}
                      color="blue"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ambient Light */}
          <div className="space-y-2 p-2 bg-editor-panel/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🌫️</span>
              <span className="text-white text-sm font-medium">Ambient Light</span>
            </div>
            <ColorInput
              label="Renk"
              value={environment.ambientLight?.color || '#ffffff'}
              onChange={(color) => updateEnvironment({
                ambientLight: { ...environment.ambientLight!, color }
              })}
            />
            <SliderInput
              label="Şiddet"
              value={environment.ambientLight?.intensity || 0.5}
              min={0}
              max={2}
              step={0.05}
              onChange={(intensity) => updateEnvironment({
                ambientLight: { ...environment.ambientLight!, intensity }
              })}
              color="cyan"
            />
          </div>

          {/* Hemisphere Light */}
          <div className="space-y-2 p-2 bg-editor-panel/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🌅</span>
              <span className="text-white text-sm font-medium">Hemisphere Light</span>
            </div>
            <ColorInput
              label="Gökyüzü Rengi"
              value={environment.hemisphereLight?.skyColor || '#ffffff'}
              onChange={(skyColor) => updateEnvironment({
                hemisphereLight: { ...environment.hemisphereLight!, skyColor }
              })}
            />
            <ColorInput
              label="Zemin Rengi"
              value={environment.hemisphereLight?.groundColor || '#444444'}
              onChange={(groundColor) => updateEnvironment({
                hemisphereLight: { ...environment.hemisphereLight!, groundColor }
              })}
            />
            <SliderInput
              label="Şiddet"
              value={environment.hemisphereLight?.intensity || 0.5}
              min={0}
              max={2}
              step={0.05}
              onChange={(intensity) => updateEnvironment({
                hemisphereLight: { ...environment.hemisphereLight!, intensity }
              })}
              color="blue"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Add Light Buttons */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-medium">Işık Ekle</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAddLight('directional')}
            className="flex flex-col items-center gap-1 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
          >
            <span className="text-xl">☀️</span>
            <span className="text-[10px]">Directional</span>
          </button>
          <button
            onClick={() => handleAddLight('point')}
            className="flex flex-col items-center gap-1 py-2 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/30 text-orange-400 rounded-lg transition-colors"
          >
            <span className="text-xl">💡</span>
            <span className="text-[10px]">Point</span>
          </button>
          <button
            onClick={() => handleAddLight('spot')}
            className="flex flex-col items-center gap-1 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 rounded-lg transition-colors"
          >
            <span className="text-xl">🔦</span>
            <span className="text-[10px]">Spot</span>
          </button>
        </div>
      </div>

      {/* Lights List */}
      {lights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 font-medium">Sahne Işıkları ({lights.length})</label>
            {lights.length > 1 && (
              <button
                onClick={() => {
                  if (confirm('Tüm ışıkları silmek istediğinize emin misiniz?')) {
                    lights.forEach(l => removeLight(l.id))
                  }
                }}
                className="text-[10px] text-red-400 hover:text-red-300"
              >
                Tümünü Sil
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {lights.map((light) => (
              <LightEditor
                key={light.id}
                light={light}
                onUpdate={(updates) => updateLight(light.id, updates)}
                onDelete={() => removeLight(light.id)}
                onSelect={() => {
                  // This would ideally focus the 3D view on the light
                  console.log('Select light:', light.id)
                }}
                isSelected={selectedObjectId === light.id}
              />
            ))}
          </div>
        </div>
      )}

      {lights.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <span className="text-3xl block mb-2">💡</span>
          <p className="text-sm">Henüz sahne ışığı yok</p>
          <p className="text-xs">Yukarıdan bir ışık türü seçin</p>
        </div>
      )}
    </div>
  )
}

// Export utility components
export { ColorInput, PositionInput }
