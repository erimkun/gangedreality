import { useHotspotStore, HotspotShape } from '@/store/useHotspotStore'
import { SectionHeader, SliderNumberInput } from './shared'
import { useState, useEffect } from 'react'

const SHAPE_OPTIONS: { value: HotspotShape; label: string; icon: string }[] = [
  { value: 'circle', label: 'Daire', icon: '⭕' },
  { value: 'ring', label: 'Halka', icon: '◎' },
  { value: 'double-ring', label: 'Çift Halka', icon: '⦿' },
  { value: 'square', label: 'Kare', icon: '⬜' },
  { value: 'triangle', label: 'Üçgen', icon: '△' },
  { value: 'star', label: 'Yıldız', icon: '⭐' },
  { value: 'target', label: 'Hedef', icon: '🎯' },
  { value: 'hexagon', label: 'Altıgen', icon: '⬡' },
  { value: 'diamond', label: 'Elmas', icon: '◇' },
  { value: 'arrow', label: 'Ok', icon: '➤' },
  { value: 'custom', label: 'Özel Resim', icon: '🖼️' },
]

export default function HotspotPanel() {
  const { nodes, addNode, removeNode, updateNode, settings, updateSettings, isHotspotMode, setHotspotMode } = useHotspotStore()
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null)
  
  // Toggle "Add Mode"
  const toggleAddMode = () => {
    setHotspotMode(!isHotspotMode)
  }

  // Listen for custom event from HotspotRenderer to add node
  useEffect(() => {
    const handleAddNodeAtPosition = (e: CustomEvent) => {
      const position = e.detail.position
      if (position) {
        addNode(position)
        // Optional: Turn off mode after adding one?
        // setHotspotMode(false) 
      }
    }

    window.addEventListener('add-hotspot-node', handleAddNodeAtPosition as EventListener)
    return () => {
      window.removeEventListener('add-hotspot-node', handleAddNodeAtPosition as EventListener)
    }
  }, [addNode, setHotspotMode])

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2">
      <SectionHeader 
        title="Navigasyon Noktaları" 
        icon="📍" 
        gradient="from-blue-600/20 to-cyan-600/20" 
      />
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200">
        <p>Bu noktalar "Viewer" modunda oyuncunun tıklayarak gidebileceği durakları belirler.</p>
      </div>

      {/* Add Button */}
      <button
        onClick={toggleAddMode}
        className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
          isHotspotMode 
            ? 'bg-green-600 hover:bg-green-500 text-white animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        <span>{isHotspotMode ? '🎯' : '➕'}</span> 
        {isHotspotMode ? 'Tıklayarak Yerleştir...' : 'Nokta Ekleme Modu'}
      </button>
      
      {isHotspotMode && (
        <div className="mt-2 p-2 bg-black/20 rounded border border-green-500/30">
          <p className="text-[10px] text-center text-green-400 mb-2">
            Sahne üzerinde istediğiniz yere tıklayarak nokta ekleyin.
          </p>
          
          {/* List of Walkable Meshes */}
          <div className="text-xs text-gray-400">
            <div className="font-medium mb-1 text-gray-300">Aktif Yürünebilir Alanlar:</div>
            {settings.walkableMeshIds && settings.walkableMeshIds.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                {settings.walkableMeshIds.map(id => (
                  <li key={id} className="truncate text-[10px]">{id}</li>
                ))}
              </ul>
            ) : (
              <div className="text-red-400 italic text-[10px]">Hiçbir alan seçili değil! Nokta ekleyemezsiniz.</div>
            )}
          </div>
        </div>
      )}

      {/* Node List */}
      <div className="space-y-2 mt-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Noktalar ({nodes.length})</h3>
        
        {nodes.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Henüz nokta eklenmemiş.
          </div>
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {nodes.map((node, index) => (
            <div key={node.id} className="bg-editor-bg border border-gray-700 rounded overflow-hidden transition-colors">
              {/* Header Row */}
              <div className="p-2 flex items-center justify-between group hover:bg-white/5">
                <div className="flex items-center gap-2 flex-1">
                  <button 
                    onClick={() => setExpandedNodeId(expandedNodeId === node.id ? null : node.id)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    {expandedNodeId === node.id ? '▼' : '▶'}
                  </button>
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <input 
                    type="text" 
                    value={node.label || ''} 
                    onChange={(e) => updateNode(node.id, { label: e.target.value })}
                    className="bg-transparent text-sm text-white focus:outline-none w-24"
                    placeholder="İsimsiz"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => removeNode(node.id)}
                    className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedNodeId === node.id && (
                <div className="p-2 bg-black/20 border-t border-gray-700 space-y-3">
                  {/* Position */}
                  <div className="flex gap-2 text-[10px] text-gray-400">
                    <div className="flex items-center flex-1">
                      <span className="text-red-400 mr-1 w-4">X:</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={node.position[0]} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          updateNode(node.id, { position: [val, node.position[1], node.position[2]] })
                        }}
                        className="bg-editor-input w-full px-1 rounded text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center flex-1">
                      <span className="text-green-400 mr-1 w-4">Y:</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={node.position[1]} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          updateNode(node.id, { position: [node.position[0], val, node.position[2]] })
                        }}
                        className="bg-editor-input w-full px-1 rounded text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center flex-1">
                      <span className="text-blue-400 mr-1 w-4">Z:</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={node.position[2]} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          updateNode(node.id, { position: [node.position[0], node.position[1], val] })
                        }}
                        className="bg-editor-input w-full px-1 rounded text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Individual Settings */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Şekil</label>
                      <select 
                        value={node.shape || 'circle'}
                        onChange={(e) => updateNode(node.id, { shape: e.target.value as HotspotShape })}
                        className="w-full bg-editor-input text-xs text-white rounded px-1 py-1 focus:outline-none border border-gray-700"
                      >
                        {SHAPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Renk</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={node.color || settings.nodeColor}
                          onChange={(e) => updateNode(node.id, { color: e.target.value })}
                          className="bg-transparent w-6 h-6 rounded cursor-pointer"
                        />
                        <button 
                          onClick={() => updateNode(node.id, { color: undefined })}
                          className="text-[10px] text-gray-500 hover:text-white underline"
                          title="Varsayılana Dön"
                        >
                          Sıfırla
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Icon URL Input */}
                  {node.shape === 'custom' && (
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Resim Dosyası</label>
                      <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={node.customIconUrl || ''} 
                            readOnly
                            className="w-full bg-editor-input text-xs text-white rounded px-1 py-1 focus:outline-none border border-gray-700 opacity-50"
                            placeholder="Dosya seçin..."
                        />
                        <label className="shrink-0 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 text-xs flex items-center justify-center transition-colors">
                            <span>📂</span>
                            <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.svg"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        const url = URL.createObjectURL(file)
                                        // Revoke old blob URL if exists
                                        if (node.customIconUrl && node.customIconUrl.startsWith('blob:')) {
                                            URL.revokeObjectURL(node.customIconUrl)
                                        }
                                        // Store for export
                                        const win = window as any
                                        if (!win.__loadedTextures) win.__loadedTextures = new Map()
                                        const fileName = `icon_node_${node.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                                        win.__loadedTextures.set(fileName, file)
                                        
                                        if (!win.__blobUrlToFileName) win.__blobUrlToFileName = new Map()
                                        win.__blobUrlToFileName.set(url, `textures/${fileName}`)
                                        
                                        updateNode(node.id, { customIconUrl: url })
                                    }
                                }}
                            />
                        </label>
                      </div>
                    </div>
                  )}

                  <SliderNumberInput
                    label="Boyut"
                    value={node.size || settings.cursorSize}
                    onChange={(v) => updateNode(node.id, { size: v })}
                    min={0.1}
                    max={3}
                    step={0.1}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-gray-700 pt-4 mt-4 space-y-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Varsayılan Ayarlar</h3>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">Varsayılan Şekil</label>
          <select 
            value={settings.defaultShape || 'circle'}
            onChange={(e) => updateSettings({ defaultShape: e.target.value as HotspotShape })}
            className="w-full bg-editor-input text-xs text-white rounded px-2 py-1.5 focus:outline-none border border-gray-700"
          >
            {SHAPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
            ))}
          </select>
        </div>

        {settings.defaultShape === 'custom' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Varsayılan Resim Dosyası</label>
            <div className="flex gap-2">
                <input 
                type="text" 
                value={settings.defaultCustomIconUrl || ''} 
                readOnly
                className="w-full bg-editor-input text-xs text-white rounded px-2 py-1.5 focus:outline-none border border-gray-700 opacity-50"
                placeholder="Dosya seçin..."
                />
                <label className="shrink-0 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1.5 text-xs flex items-center justify-center transition-colors">
                    <span>📂</span>
                    <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                const url = URL.createObjectURL(file)
                                // Revoke old blob URL if exists
                                if (settings.defaultCustomIconUrl && settings.defaultCustomIconUrl.startsWith('blob:')) {
                                    URL.revokeObjectURL(settings.defaultCustomIconUrl)
                                }
                                // Store for export
                                const win = window as any
                                if (!win.__loadedTextures) win.__loadedTextures = new Map()
                                const fileName = `icon_default_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                                win.__loadedTextures.set(fileName, file)
                                
                                if (!win.__blobUrlToFileName) win.__blobUrlToFileName = new Map()
                                win.__blobUrlToFileName.set(url, `textures/${fileName}`)
                                
                                updateSettings({ defaultCustomIconUrl: url })
                            }
                        }}
                    />
                </label>
            </div>
          </div>
        )}
        
        <SliderNumberInput
          label="İmleç Boyutu"
          value={settings.cursorSize}
          onChange={(v) => updateSettings({ cursorSize: v })}
          min={0.1}
          max={3}
          step={0.1}
        />
        
        <SliderNumberInput
          label="Animasyon Hızı (sn)"
          value={settings.animationDuration}
          onChange={(v) => updateSettings({ animationDuration: v })}
          min={0.1}
          max={5}
          step={0.1}
        />
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">Varsayılan Nokta Rengi</label>
          <div className="flex gap-2">
            <input 
              type="color" 
              value={settings.nodeColor}
              onChange={(e) => updateSettings({ nodeColor: e.target.value })}
              className="bg-transparent w-8 h-8 rounded cursor-pointer"
            />
            <span className="text-xs text-gray-300 self-center">{settings.nodeColor}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Oyuncu İmleç Rengi</label>
          <div className="flex gap-2">
            <input 
              type="color" 
              value={settings.cursorColor}
              onChange={(e) => updateSettings({ cursorColor: e.target.value })}
              className="bg-transparent w-8 h-8 rounded cursor-pointer"
            />
            <span className="text-xs text-gray-300 self-center">{settings.cursorColor}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
