/**
 * Interactions Panel - Interactive zones and popup management
 */

import { useState } from 'react'
import { useInteractionsStore } from '../../../store/useInteractionsStore'
import { InteractionZone } from '../../../types'
import { EditableVectorInput, EmptyState } from './shared'
import BlockEditor from './BlockEditor'
import BlockRenderer from '../BlockRenderer'

export default function InteractionsPanel() {
  const { zones, addZone, removeZone, activeZoneId, setActiveZone, updateZone, updateZonePopup } = useInteractionsStore()
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content')

  const handleAddZone = () => {
    addZone([0, 1.5, 0])
  }

  const activeZone = zones.find(z => z.id === activeZoneId)

  // Get style with defaults
  const getStyleValue = <T extends number | string>(key: keyof NonNullable<typeof activeZone>['popup']['style'], defaultVal: T): T => {
    if (!activeZone) return defaultVal
    return (activeZone.popup.style[key] as T) ?? defaultVal
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleAddZone}
        className="w-full bg-primary hover:bg-primary/80 text-editor-bg font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Yeni Bilgi Noktası Ekle
      </button>

      {/* Zone List */}
      <div className="space-y-2">
        {zones.map(zone => (
          <div
            key={zone.id}
            className={`bg-editor-input rounded-lg p-3 cursor-pointer transition-all border ${activeZoneId === zone.id
              ? 'border-primary ring-1 ring-primary/50'
              : 'border-transparent hover:border-gray-600'
              }`}
            onClick={() => setActiveZone(zone.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-primary">📍</span>
                <span className="text-white text-sm truncate">{zone.popup.title || 'Yeni Nokta'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 bg-editor-bg px-2 py-0.5 rounded">
                  {zone.triggerType === 'proximity' ? '🚶 Yaklaşınca' : '👆 Tıklayınca'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeZone(zone.id) }}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Zone Editor */}
      {activeZone && (
        <div className="bg-editor-input rounded-xl overflow-hidden border border-primary/30">
          {/* Editor Tabs */}
          <div className="flex border-b border-editor-border">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'content'
                ? 'bg-primary/20 text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              İçerik
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'style'
                ? 'bg-primary/20 text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Stil
            </button>
          </div>

          <div className="p-4 space-y-4">
            {activeTab === 'content' && (
              <ContentTab
                zone={activeZone}
                updateZone={updateZone}
                updateZonePopup={updateZonePopup}
              />
            )}

            {activeTab === 'style' && (
              <StyleTab
                zone={activeZone}
                getStyleValue={getStyleValue}
                updateZonePopup={updateZonePopup}
              />
            )}

            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full py-2.5 bg-editor-panel border border-editor-border rounded-lg text-sm text-gray-300 hover:text-white hover:border-primary transition-colors flex items-center justify-center gap-2"
            >
              {showPreview ? '🙈 Önizlemeyi Gizle' : '👁️ Önizleme'}
            </button>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreview && activeZone && (
        <PopupPreview zone={activeZone} onClose={() => setShowPreview(false)} />
      )}

      {zones.length === 0 && (
        <EmptyState
          icon="📍"
          title="Henüz bilgi noktası eklenmedi."
          description="Yukarıdaki butona tıklayarak ekleyin."
        />
      )}
    </div>
  )
}

// ============================================
// Content Tab
// ============================================

interface ContentTabProps {
  zone: InteractionZone
  updateZone: (id: string, updates: Partial<InteractionZone>) => void
  updateZonePopup: (id: string, popup: Partial<InteractionZone['popup']>) => void
}

function ContentTab({ zone, updateZone, updateZonePopup }: ContentTabProps) {
  return (
    <>
      {/* Position */}
      <EditableVectorInput
        label="Pozisyon"
        values={zone.position as [number, number, number]}
        onChange={(pos) => updateZone(zone.id, { position: pos })}
      />

      {/* Radius */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <label className="text-xs text-gray-400">Yarıçap</label>
          <span className="text-xs text-primary">{zone.radius.toFixed(1)}m</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={zone.radius}
          onChange={(e) => updateZone(zone.id, { radius: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      {/* Trigger Type */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Tetikleme Türü</label>
        <select
          value={zone.triggerType}
          onChange={(e) => updateZone(zone.id, { triggerType: e.target.value as 'proximity' | 'click' })}
          className="w-full bg-editor-panel border border-editor-border rounded-lg px-3 py-2 text-white text-sm focus:border-primary"
        >
          <option value="proximity">🚶 Yaklaşınca Göster</option>
          <option value="click">👆 Tıklayınca Göster</option>
        </select>
      </div>

      <hr className="border-editor-border" />

      {/* Popup Title */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Başlık</label>
        <input
          type="text"
          value={zone.popup.title}
          onChange={(e) => updateZonePopup(zone.id, { title: e.target.value })}
          placeholder="Başlık"
          className="w-full bg-editor-panel border border-editor-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-bold"
        />
      </div>

      {/* Block Editor */}
      <div className="space-y-2">
        <label className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-2">
          🏗️ İçerik Blokları
        </label>
        <BlockEditor
          blocks={zone.popup.blocks || []}
          onChange={(blocks) => updateZonePopup(zone.id, { blocks })}
        />
      </div>
    </>
  )
}

// ============================================
// Style Tab
// ============================================

interface StyleTabProps {
  zone: InteractionZone
  getStyleValue: <T extends number | string>(key: keyof InteractionZone['popup']['style'], defaultVal: T) => T
  updateZonePopup: (id: string, popup: Partial<InteractionZone['popup']>) => void
}

function StyleTab({ zone, getStyleValue, updateZonePopup }: StyleTabProps) {
  return (
    <>
      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Arka Plan</label>
          <input
            type="color"
            value={getStyleValue('backgroundColor', '#1d1a15')}
            onChange={(e) => updateZonePopup(zone.id, {
              style: { ...zone.popup.style, backgroundColor: e.target.value }
            })}
            className="w-full h-9 rounded cursor-pointer border border-gray-600"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Metin Rengi</label>
          <input
            type="color"
            value={getStyleValue('textColor', '#ffffff')}
            onChange={(e) => updateZonePopup(zone.id, {
              style: { ...zone.popup.style, textColor: e.target.value }
            })}
            className="w-full h-9 rounded cursor-pointer border border-gray-600"
          />
        </div>
      </div>

      {/* Padding & Border Radius */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Padding: {getStyleValue('padding', 20)}px</label>
          <input
            type="range"
            min="8"
            max="40"
            value={getStyleValue('padding', 20)}
            onChange={(e) => updateZonePopup(zone.id, {
              style: { ...zone.popup.style, padding: parseInt(e.target.value) }
            })}
            className="w-full accent-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Köşe: {getStyleValue('borderRadius', 16)}px</label>
          <input
            type="range"
            min="0"
            max="32"
            value={getStyleValue('borderRadius', 16)}
            onChange={(e) => updateZonePopup(zone.id, {
              style: { ...zone.popup.style, borderRadius: parseInt(e.target.value) }
            })}
            className="w-full accent-primary"
          />
        </div>
      </div>

      {/* Opacity & Blur */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Opaklık: {Math.round(getStyleValue('opacity', 1) * 100)}%</label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={getStyleValue('opacity', 1)}
            onChange={(e) => updateZonePopup(zone.id, {
              style: { ...zone.popup.style, opacity: parseFloat(e.target.value) }
            })}
            className="w-full accent-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Blur: {getStyleValue('backdropBlur', 20)}px</label>
          <input
            type="range"
            min="0"
            max="40"
            value={getStyleValue('backdropBlur', 20)}
            onChange={(e) => updateZonePopup(zone.id, {
              style: { ...zone.popup.style, backdropBlur: parseInt(e.target.value) }
            })}
            className="w-full accent-primary"
          />
        </div>
      </div>

      {/* Max Width */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Maksimum Genişlik: {getStyleValue('maxWidth', 340)}px</label>
        <input
          type="range"
          min="280"
          max="500"
          value={getStyleValue('maxWidth', 340) as number}
          onChange={(e) => updateZonePopup(zone.id, {
            style: { ...zone.popup.style, maxWidth: parseInt(e.target.value) }
          })}
          className="w-full accent-primary"
        />
      </div>

      {/* Shadow */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Gölge</label>
        <div className="grid grid-cols-5 gap-1">
          {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <button
              key={size}
              onClick={() => updateZonePopup(zone.id, {
                style: { ...zone.popup.style, shadowSize: size }
              })}
              className={`py-1.5 rounded text-[10px] uppercase font-bold transition-colors ${getStyleValue('shadowSize', 'xl') === size
                ? 'bg-primary text-editor-bg'
                : 'bg-editor-panel text-gray-400 hover:text-white'
                }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}



// ============================================
// Popup Preview Component
// ============================================

interface PopupPreviewProps {
  zone: InteractionZone
  onClose: () => void
}

function PopupPreview({ zone, onClose }: PopupPreviewProps) {
  const style = zone.popup.style
  const padding = style.padding || 20
  const borderRadius = style.borderRadius || 16
  const backdropBlur = style.backdropBlur || 20
  const maxWidth = style.maxWidth || 340
  const shadowSize = style.shadowSize || 'xl'

  const shadowClasses: Record<string, string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-2xl shadow-black/50'
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-start p-4 pt-20" onClick={onClose}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-50" />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative overflow-hidden ${shadowClasses[shadowSize]} animate-fade-in-up`}
        style={{
          backgroundColor: style.backgroundColor,
          color: style.textColor,
          opacity: style.opacity,
          padding: `${padding}px`,
          borderRadius: `${borderRadius}px`,
          borderWidth: `${style.borderWidth || 1}px`,
          borderColor: style.borderColor || 'rgba(255,255,255,0.1)',
          borderStyle: 'solid',
          backdropFilter: `blur(${backdropBlur}px)`,
          maxWidth: `${maxWidth}px`,
          width: '100%'
        }}
      >
        <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">{zone.popup.title || 'Başlık'}</h2>

        {/* Render Blocks */}
        <BlockRenderer blocks={zone.popup.blocks || []} />

        <p className="text-center text-[10px] mt-4 opacity-50 border-t border-white/5 pt-2">Kapatmak için tıklayın</p>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm flex items-center gap-2">
        <span>Önizlemeyi kapatmak için herhangi bir yere tıklayın</span>
      </div>
    </div>
  )
}
