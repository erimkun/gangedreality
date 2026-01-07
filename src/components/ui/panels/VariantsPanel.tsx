/**
 * Variants Panel - Material variants and configurator management
 */

import { useState, useEffect } from 'react'
import { useVariantsStore } from '../../../store/useVariantsStore'
import { useEditorStore } from '../../../store/useEditorStore'
import { useToastStore } from '../../../store/useToastStore'
import { EmptyState } from './shared'

// ============================================
// Types
// ============================================

interface PreAssetMaterial {
  id: string
  name: string
  category: string
  textureUrl: string
  thumbnail?: string
  normalMapUrl?: string
}

interface BuiltInMaterial {
  id: string
  name: string
  category: string
  color: string
  metalness: number
  roughness: number
}

// ============================================
// Constants
// ============================================

// Built-in color materials from MaterialLibrary
const builtInMaterials: BuiltInMaterial[] = [
  // Metals
  { id: 'gold', name: 'Altın', category: 'metal', color: '#FFD700', metalness: 1, roughness: 0.2 },
  { id: 'silver', name: 'Gümüş', category: 'metal', color: '#C0C0C0', metalness: 1, roughness: 0.15 },
  { id: 'copper', name: 'Bakır', category: 'metal', color: '#B87333', metalness: 1, roughness: 0.3 },
  { id: 'bronze', name: 'Bronz', category: 'metal', color: '#CD7F32', metalness: 0.9, roughness: 0.4 },
  { id: 'chrome', name: 'Krom', category: 'metal', color: '#E8E8E8', metalness: 1, roughness: 0.05 },
  { id: 'steel', name: 'Çelik', category: 'metal', color: '#71797E', metalness: 0.95, roughness: 0.25 },
  // Woods
  { id: 'oak', name: 'Meşe', category: 'wood', color: '#806517', metalness: 0, roughness: 0.7 },
  { id: 'walnut', name: 'Ceviz', category: 'wood', color: '#5C4033', metalness: 0, roughness: 0.65 },
  { id: 'maple', name: 'Akçaağaç', category: 'wood', color: '#F5DEB3', metalness: 0, roughness: 0.6 },
  { id: 'mahogany', name: 'Maun', category: 'wood', color: '#C04000', metalness: 0, roughness: 0.55 },
  // Fabrics
  { id: 'leather-black', name: 'Siyah Deri', category: 'fabric', color: '#1a1a1a', metalness: 0, roughness: 0.5 },
  { id: 'leather-brown', name: 'Kahve Deri', category: 'fabric', color: '#8B4513', metalness: 0, roughness: 0.5 },
  { id: 'velvet-red', name: 'Kırmızı Kadife', category: 'fabric', color: '#8B0000', metalness: 0, roughness: 0.9 },
  { id: 'velvet-blue', name: 'Mavi Kadife', category: 'fabric', color: '#191970', metalness: 0, roughness: 0.9 },
  // Stone
  { id: 'marble-white', name: 'Beyaz Mermer', category: 'stone', color: '#F5F5F5', metalness: 0, roughness: 0.3 },
  { id: 'marble-black', name: 'Siyah Mermer', category: 'stone', color: '#1C1C1C', metalness: 0, roughness: 0.25 },
  { id: 'granite', name: 'Granit', category: 'stone', color: '#676767', metalness: 0, roughness: 0.6 },
  // Plastics
  { id: 'plastic-white', name: 'Beyaz Plastik', category: 'plastic', color: '#FFFFFF', metalness: 0, roughness: 0.4 },
  { id: 'plastic-black', name: 'Siyah Plastik', category: 'plastic', color: '#0D0D0D', metalness: 0, roughness: 0.35 },
  { id: 'rubber', name: 'Kauçuk', category: 'plastic', color: '#2F2F2F', metalness: 0, roughness: 0.95 },
]

const materialCategories = [
  { id: 'metal', name: 'Metal', icon: '🔩' },
  { id: 'wood', name: 'Ahşap', icon: '🪵' },
  { id: 'fabric', name: 'Kumaş', icon: '🧵' },
  { id: 'stone', name: 'Taş', icon: '🪨' },
  { id: 'plastic', name: 'Plastik', icon: '🧴' },
]

// ============================================
// Main Component
// ============================================

export default function VariantsPanel() {
  const { configurableGroups, createGroup, selectOption, addOption, removeGroup, updateGroup, addMeshToGroup, removeMeshFromGroup, removeOption, updateOption } = useVariantsStore()
  const { selectedMeshName, selectedMeshNames } = useEditorStore()
  
  // State
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [addMode, setAddMode] = useState<'color' | 'texture' | 'preset' | null>(null)
  const [newColor, setNewColor] = useState('#ffffff')
  const [newName, setNewName] = useState('')
  const [textureFile, setTextureFile] = useState<File | null>(null)
  const [texturePreview, setTexturePreview] = useState<string | null>(null)
  const [normalMapFile, setNormalMapFile] = useState<File | null>(null)
  const [normalMapPreview, setNormalMapPreview] = useState<string | null>(null)
  const [roughnessMapFile, setRoughnessMapFile] = useState<File | null>(null)
  const [roughnessMapPreview, setRoughnessMapPreview] = useState<string | null>(null)
  const [metalness, setMetalness] = useState(0)
  const [roughness, setRoughness] = useState(1)
  const [tilingX, setTilingX] = useState(1)
  const [tilingY, setTilingY] = useState(1)
  const [preAssets, setPreAssets] = useState<PreAssetMaterial[]>([])
  const [showPreAssets, setShowPreAssets] = useState(false)
  const [preAssetFilter, setPreAssetFilter] = useState<string>('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string | null>(null)
  
  // Edit option state - includes all editable properties
  type Option = {
    name: string
    type: string
    value?: string
    textureUrl?: string
    normalMapUrl?: string
    roughnessMapUrl?: string
    metalness?: number
    roughness?: number
    tiling?: [number, number]
  }

  const [editingOption, setEditingOption] = useState<{
    groupId: string
    optionIndex: number
    option: Option
  } | null>(null)
  
  const { addToast } = useToastStore()
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    type: 'group' | 'option'
    groupId: string
    optionIndex?: number
    name: string
  }>({
    isOpen: false,
    type: 'group',
    groupId: '',
    name: ''
  })
  
  // Load pre-assets on mount
  useEffect(() => {
    fetch('/pre-assets/materials.json')
      .then(res => res.json())
      .then(data => setPreAssets(data.materials || []))
      .catch(err => console.error('Failed to load pre-assets:', err))
  }, [])
  
  // ============================================
  // Handlers
  // ============================================
  
  const handleCreateGroup = () => {
    const meshNames = selectedMeshNames.length > 0 ? selectedMeshNames : (selectedMeshName ? [selectedMeshName] : [])
    if (meshNames.length > 0) {
      const groupName = meshNames.length > 1 
        ? `${meshNames.length} Mesh Grubu` 
        : `${meshNames[0]} Grubu`
      createGroup(groupName, meshNames)
    }
  }

  const handleAddColor = (groupId: string) => {
    if (newName.trim()) {
      addOption(groupId, {
        name: newName.trim(),
        type: 'color',
        value: newColor
      })
      resetAddForm()
    }
  }

  // Convert file to base64 data URL (persistent, doesn't expire like blob URLs)
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleTextureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTextureFile(file)
      // Use data URL instead of blob URL for persistence
      const dataUrl = await fileToDataUrl(file)
      setTexturePreview(dataUrl)
    }
  }

  const handleNormalMapSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNormalMapFile(file)
      const dataUrl = await fileToDataUrl(file)
      setNormalMapPreview(dataUrl)
    }
  }

  const handleRoughnessMapSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setRoughnessMapFile(file)
      const dataUrl = await fileToDataUrl(file)
      setRoughnessMapPreview(dataUrl)
    }
  }

  const handleAddTexture = (groupId: string) => {
    if (newName.trim() && textureFile && texturePreview) {
      // Store texture files for later export
      const win = window as Window & { 
        __loadedTextures?: Map<string, File>
        __dataUrlToFileName?: Map<string, string> 
      }
      
      if (!win.__loadedTextures) win.__loadedTextures = new Map()
      if (!win.__dataUrlToFileName) win.__dataUrlToFileName = new Map()
      
      const timestamp = Date.now()
      
      // 1. Main Texture
      const textureFileName = `variant_${timestamp}_diff_${textureFile.name}`
      win.__loadedTextures.set(textureFileName, textureFile)
      win.__dataUrlToFileName.set(texturePreview, `textures/${textureFileName}`)
      
      let normalMapUrl: string | undefined
      if (normalMapFile && normalMapPreview) {
        const normalFileName = `variant_${timestamp}_norm_${normalMapFile.name}`
        win.__loadedTextures.set(normalFileName, normalMapFile)
        win.__dataUrlToFileName.set(normalMapPreview, `textures/${normalFileName}`)
        normalMapUrl = normalMapPreview
      }

      let roughnessMapUrl: string | undefined
      if (roughnessMapFile && roughnessMapPreview) {
        const roughFileName = `variant_${timestamp}_rough_${roughnessMapFile.name}`
        win.__loadedTextures.set(roughFileName, roughnessMapFile)
        win.__dataUrlToFileName.set(roughnessMapPreview, `textures/${roughFileName}`)
        roughnessMapUrl = roughnessMapPreview
      }
      
      addOption(groupId, {
        name: newName.trim(),
        type: 'texture',
        textureUrl: texturePreview,
        normalMapUrl,
        roughnessMapUrl,
        metalness,
        roughness,
        tiling: [tilingX, tilingY]
      })
      resetAddForm()
    }
  }

  const handleAddPreAsset = (groupId: string, asset: PreAssetMaterial) => {
    addOption(groupId, {
      name: asset.name,
      type: 'texture',
      textureUrl: asset.textureUrl,
      tiling: [1, 1]
    })
    resetAddForm()
  }

  const handleAddBuiltInMaterial = (groupId: string, material: BuiltInMaterial) => {
    addOption(groupId, {
      name: material.name,
      type: 'color',
      value: material.color,
      metalness: material.metalness,
      roughness: material.roughness
    })
    resetAddForm()
  }

  const resetAddForm = () => {
    setActiveGroupId(null)
    setAddMode(null)
    setNewName('')
    setNewColor('#ffffff')
    setTextureFile(null)
    // No need to revoke - we use data URLs now, not blob URLs
    setTexturePreview(null)
    
    setNormalMapFile(null)
    setNormalMapPreview(null)

    setRoughnessMapFile(null)
    setRoughnessMapPreview(null)

    setMetalness(0)
    setRoughness(1)
    setTilingX(1)
    setTilingY(1)

    setShowPreAssets(false)
    setPreAssetFilter('')
    setSelectedMaterialCategory(null)
  }

  const openAddPanel = (groupId: string) => {
    setActiveGroupId(groupId)
    setAddMode(null)
  }

  const openEditPanel = (group: typeof configurableGroups[0]) => {
    setEditingGroupId(group.id)
    setEditGroupName(group.displayName)
  }

  const handleSaveGroupEdit = () => {
    if (editingGroupId && editGroupName.trim()) {
      updateGroup(editingGroupId, { displayName: editGroupName.trim() })
    }
    setEditingGroupId(null)
    setEditGroupName('')
  }

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'group',
      groupId,
      name: groupName
    })
  }

  const handleRemoveMesh = (groupId: string, meshName: string) => {
    removeMeshFromGroup(groupId, meshName)
  }

  const handleAddCurrentMeshToGroup = (groupId: string) => {
    const meshNames = selectedMeshNames.length > 0 ? selectedMeshNames : (selectedMeshName ? [selectedMeshName] : [])
    meshNames.forEach(name => addMeshToGroup(groupId, name))
  }

  const handleDeleteOption = (groupId: string, optionIndex: number, optionName: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'option',
      groupId,
      optionIndex,
      name: optionName
    })
  }

  const handleEditOption = (groupId: string, optionIndex: number, option: Option) => {
    setEditingOption({
      groupId,
      optionIndex,
      option: { ...option }
    })
    // Select this option to see it on the model
    selectOption(groupId, optionIndex)
  }

  // Live preview - updates both local state and store for real-time changes on model
  const updateEditingOptionLive = (updates: Partial<Option>) => {
    if (!editingOption) return
    
    const newOption = { ...editingOption.option, ...updates }
    setEditingOption({
      ...editingOption,
      option: newOption
    })
    // Update store immediately for live preview on model
    updateOption(editingOption.groupId, editingOption.optionIndex, updates)
  }

  // Handle adding/removing texture maps in edit mode
  const handleEditNormalMapSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editingOption) {
      const dataUrl = await fileToDataUrl(file)
      updateEditingOptionLive({ normalMapUrl: dataUrl })
    }
  }

  const handleEditRoughnessMapSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editingOption) {
      const dataUrl = await fileToDataUrl(file)
      updateEditingOptionLive({ roughnessMapUrl: dataUrl })
    }
  }

  const handleRemoveNormalMap = () => {
    if (editingOption) {
      updateEditingOptionLive({ normalMapUrl: undefined })
    }
  }

  const handleRemoveRoughnessMap = () => {
    if (editingOption) {
      updateEditingOptionLive({ roughnessMapUrl: undefined })
    }
  }

  const handleSaveOptionEdit = () => {
    if (editingOption) {
      // Final save (already updated live, just close and show toast)
      addToast(`${editingOption.option.name} güncellendi`, 'success')
      setEditingOption(null)
    }
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'group') {
      removeGroup(deleteConfirm.groupId)
      addToast(`${deleteConfirm.name} grubu silindi`, 'success')
    } else if (deleteConfirm.type === 'option' && deleteConfirm.optionIndex !== undefined) {
      removeOption(deleteConfirm.groupId, deleteConfirm.optionIndex)
      addToast(`${deleteConfirm.name} seçeneği silindi`, 'success')
    }
    setDeleteConfirm({ ...deleteConfirm, isOpen: false })
  }

  // Helper function to adjust color brightness for metallic effect
  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, Math.max(0, (num >> 16) + amt))
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
  }
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="space-y-4">
      {selectedMeshName || selectedMeshNames.length > 0 ? (
        <button 
          onClick={handleCreateGroup}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors text-sm"
        >
          🎨 {selectedMeshNames.length > 1 ? `${selectedMeshNames.length} Mesh'i` : 'Seçili Mesh\'i'} Varyant Yap
        </button>
      ) : (
        <EmptyState 
          icon="🎨"
          title="Varyasyon grubu oluşturmak için bir mesh seçin"
        />
      )}
      
      {/* Groups List */}
      <div className="space-y-3">
        {configurableGroups.map(group => (
          <div key={group.id} className="bg-editor-bg rounded-lg p-3">
            {/* Group Header */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white text-sm font-medium">{group.displayName}</h4>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditPanel(group)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Düzenle"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id, group.displayName)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                  title="Sil"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Edit Mode */}
            {editingGroupId === group.id ? (
              <GroupEditForm 
                group={group}
                editGroupName={editGroupName}
                setEditGroupName={setEditGroupName}
                handleSaveGroupEdit={handleSaveGroupEdit}
                handleRemoveMesh={handleRemoveMesh}
                handleAddCurrentMeshToGroup={handleAddCurrentMeshToGroup}
                selectedMeshName={selectedMeshName}
                selectedMeshNames={selectedMeshNames}
                onCancel={() => setEditingGroupId(null)}
              />
            ) : (
              <p className="text-xs text-gray-400 mb-2">
                Meshler: {group.targetMeshNames.join(', ')}
              </p>
            )}
            
            {/* Options Grid */}
            <div className="flex gap-2 flex-wrap items-center mb-2">
              {group.options.map((option, idx) => (
                <OptionButton 
                  key={idx}
                  option={option}
                  isSelected={group.selectedOptionIndex === idx}
                  onSelect={() => selectOption(group.id, idx)}
                  onDelete={() => handleDeleteOption(group.id, idx, option.name)}
                  onEdit={() => handleEditOption(group.id, idx, option)}
                  adjustBrightness={adjustBrightness}
                />
              ))}
              
              {/* Add Button */}
              <button 
                onClick={() => openAddPanel(group.id)}
                className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-500 text-gray-500 hover:border-purple-400 hover:text-purple-400 transition-colors text-xl flex items-center justify-center"
              >
                +
              </button>
            </div>

            {/* Add Panel */}
            {activeGroupId === group.id && (
              <AddOptionPanel 
                groupId={group.id}
                addMode={addMode}
                setAddMode={setAddMode}
                newName={newName}
                setNewName={setNewName}
                newColor={newColor}
                setNewColor={setNewColor}
                texturePreview={texturePreview}
                normalMapPreview={normalMapPreview}
                roughnessMapPreview={roughnessMapPreview}
                metalness={metalness}
                setMetalness={setMetalness}
                roughness={roughness}
                setRoughness={setRoughness}
                tilingX={tilingX}
                setTilingX={setTilingX}
                tilingY={tilingY}
                setTilingY={setTilingY}
                showPreAssets={showPreAssets}
                setShowPreAssets={setShowPreAssets}
                preAssetFilter={preAssetFilter}
                setPreAssetFilter={setPreAssetFilter}
                preAssets={preAssets}
                selectedMaterialCategory={selectedMaterialCategory}
                setSelectedMaterialCategory={setSelectedMaterialCategory}
                handleTextureSelect={handleTextureSelect}
                handleNormalMapSelect={handleNormalMapSelect}
                handleRoughnessMapSelect={handleRoughnessMapSelect}
                handleAddColor={handleAddColor}
                handleAddTexture={handleAddTexture}
                handleAddPreAsset={handleAddPreAsset}
                handleAddBuiltInMaterial={handleAddBuiltInMaterial}
                resetAddForm={resetAddForm}
              />
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1F22] border border-white/10 rounded-xl p-4 w-full shadow-2xl">
            <h3 className="text-white font-medium mb-2">
              {deleteConfirm.type === 'group' ? 'Grubu Sil?' : 'Seçeneği Sil?'}
            </h3>
            <p className="text-white/60 text-sm mb-4">
              <span className="text-white font-medium">{deleteConfirm.name}</span> kalıcı olarak silinecek.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors font-medium"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Option Modal */}
      {editingOption && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1F22] border border-white/10 rounded-xl p-4 w-full shadow-2xl max-w-sm">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              ✏️ Varyant Düzenle
            </h3>
            
            {/* Name Input */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">Varyant Adı</label>
              <input
                type="text"
                value={editingOption.option.name}
                onChange={(e) => setEditingOption({
                  ...editingOption,
                  option: { ...editingOption.option, name: e.target.value }
                })}
                className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
              />
            </div>

            {/* Color Picker (only for color type) */}
            {editingOption.option.type === 'color' && (
              <>
                <div className="mb-3">
                  <label className="text-xs text-gray-400 block mb-1">Renk <span className="text-green-400 text-[10px]">• Canlı</span></label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editingOption.option.value || '#ffffff'}
                      onChange={(e) => updateEditingOptionLive({ value: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-600"
                    />
                    <input
                      type="text"
                      value={editingOption.option.value || '#ffffff'}
                      onChange={(e) => updateEditingOptionLive({ value: e.target.value })}
                      className="flex-1 bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Metalik ({editingOption.option.metalness?.toFixed(1) || 0}) <span className="text-green-400 text-[10px]">• Canlı</span></label>
                    <input
                      type="range"
                      min="0" max="1" step="0.05"
                      value={editingOption.option.metalness || 0}
                      onChange={(e) => updateEditingOptionLive({ metalness: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Pürüzlülük ({editingOption.option.roughness?.toFixed(1) || 1}) <span className="text-green-400 text-[10px]">• Canlı</span></label>
                    <input
                      type="range"
                      min="0" max="1" step="0.05"
                      value={editingOption.option.roughness || 1}
                      onChange={(e) => updateEditingOptionLive({ roughness: parseFloat(e.target.value) })}
                      className="w-full accent-orange-500"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Önizleme:</span>
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-600"
                    style={{
                      background: (editingOption.option.metalness || 0) > 0.5
                        ? `linear-gradient(135deg, ${adjustBrightness(editingOption.option.value || '#fff', 30)} 0%, ${editingOption.option.value} 50%, ${adjustBrightness(editingOption.option.value || '#fff', -30)} 100%)`
                        : editingOption.option.value
                    }}
                  />
                  <span className="text-green-400 text-xs">👁️ Model üzerinde canlı</span>
                </div>
              </>
            )}

            {/* Texture editing (for texture type) */}
            {editingOption.option.type === 'texture' && (
              <>
                {/* Texture Preview */}
                {editingOption.option.textureUrl && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-400 block mb-1">Mevcut Doku</label>
                    <img 
                      src={editingOption.option.textureUrl} 
                      alt="Texture" 
                      className="w-16 h-16 object-cover rounded border border-gray-600"
                    />
                  </div>
                )}

                {/* Tiling/UV Settings - LIVE */}
                <div className="mb-3">
                  <label className="text-xs text-gray-400 block mb-2">🔄 UV Döşeme (Tiling) <span className="text-green-400 text-[10px]">• Canlı</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">X Tekrar</label>
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.1"
                        value={editingOption.option.tiling?.[0] ?? 1}
                        onChange={(e) => updateEditingOptionLive({ 
                          tiling: [parseFloat(e.target.value) || 1, editingOption.option.tiling?.[1] ?? 1] 
                        })}
                        className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Y Tekrar</label>
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.1"
                        value={editingOption.option.tiling?.[1] ?? 1}
                        onChange={(e) => updateEditingOptionLive({ 
                          tiling: [editingOption.option.tiling?.[0] ?? 1, parseFloat(e.target.value) || 1] 
                        })}
                        className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Metalness - LIVE */}
                <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                  <label className="text-xs text-blue-400 block mb-1">
                    Metalik: {(editingOption.option.metalness ?? 0).toFixed(1)} <span className="text-green-400 text-[10px]">• Canlı</span>
                  </label>
                  <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={editingOption.option.metalness ?? 0}
                    onChange={(e) => updateEditingOptionLive({ metalness: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Normal Map - Add/Remove */}
                <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-yellow-400">Normal Map</span>
                    {editingOption.option.normalMapUrl ? (
                      <button
                        onClick={handleRemoveNormalMap}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        ✕ Kaldır
                      </button>
                    ) : null}
                  </div>
                  {editingOption.option.normalMapUrl ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={editingOption.option.normalMapUrl} 
                        alt="Normal Map" 
                        className="w-10 h-10 object-cover rounded border border-gray-600"
                      />
                      <span className="text-green-400 text-xs">✓ Yüklü</span>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center py-2 border border-dashed border-yellow-500/50 hover:border-yellow-400 rounded cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditNormalMapSelect}
                        className="hidden"
                      />
                      <span className="text-yellow-400/70 text-xs">+ Normal Map Ekle</span>
                    </label>
                  )}
                </div>

                {/* Roughness Map - Add/Remove */}
                <div className="mb-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-orange-400">Roughness Map</span>
                    {editingOption.option.roughnessMapUrl ? (
                      <button
                        onClick={handleRemoveRoughnessMap}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        ✕ Kaldır
                      </button>
                    ) : null}
                  </div>
                  {editingOption.option.roughnessMapUrl ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={editingOption.option.roughnessMapUrl} 
                        alt="Roughness Map" 
                        className="w-10 h-10 object-cover rounded border border-gray-600"
                      />
                      <span className="text-green-400 text-xs">✓ Yüklü</span>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center py-2 border border-dashed border-orange-500/50 hover:border-orange-400 rounded cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditRoughnessMapSelect}
                        className="hidden"
                      />
                      <span className="text-orange-400/70 text-xs">+ Roughness Map Ekle</span>
                    </label>
                  )}
                  
                  {/* Roughness Slider - directly under roughness map */}
                  <div className="mt-2 pt-2 border-t border-orange-500/20">
                    <label className="text-xs text-orange-400 block mb-1">
                      Pürüzlülük (Roughness): {(editingOption.option.roughness ?? 1).toFixed(1)} <span className="text-green-400 text-[10px]">• Canlı</span>
                    </label>
                    <input
                      type="range"
                      min="0" max="1" step="0.05"
                      value={editingOption.option.roughness ?? 1}
                      onChange={(e) => updateEditingOptionLive({ roughness: parseFloat(e.target.value) })}
                      className="w-full accent-orange-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      {editingOption.option.roughnessMapUrl 
                        ? "💡 Map ile birlikte çarpan olarak çalışır" 
                        : "💡 Map yoksa bu değer doğrudan kullanılır"}
                    </p>
                  </div>
                </div>

                <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300">
                  👁️ Değişiklikler model üzerinde canlı görüntülenir!
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setEditingOption(null)}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveOptionEdit}
                disabled={!editingOption.option.name.trim()}
                className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors font-medium"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

interface OptionButtonProps {
  option: {
    name: string
    type: string
    value?: string
    textureUrl?: string
    metalness?: number
    roughness?: number
  }
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onEdit: () => void
  adjustBrightness: (hex: string, percent: number) => string
}

function OptionButton({ option, isSelected, onSelect, onDelete, onEdit, adjustBrightness }: OptionButtonProps) {
  return (
    <div className="relative group">
      <button 
        onClick={onSelect}
        className={`w-10 h-10 rounded-lg border-2 transition-all overflow-hidden ${
          isSelected 
            ? 'border-purple-400 ring-2 ring-purple-400/50 scale-110' 
            : 'border-gray-600 hover:border-gray-400 hover:scale-105'
        }`}
        title={`${option.name}${isSelected ? ' (Seçili - Mesh üzerinde görünüyor)' : ' (Tıkla: önizle)'}`}
        style={option.type === 'color' ? {
          background: option.metalness && option.metalness > 0.5
            ? `linear-gradient(135deg, ${adjustBrightness(option.value || '#fff', 30)} 0%, ${option.value} 50%, ${adjustBrightness(option.value || '#fff', -30)} 100%)`
            : option.value
        } : undefined}
      >
        {option.type === 'texture' && option.textureUrl && (
          <img 
            src={option.textureUrl} 
            alt={option.name} 
            className="w-full h-full object-cover"
          />
        )}
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-500/30">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </button>
      {/* Delete button - top right */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md"
        title="Seçeneği Sil"
      >
        ×
      </button>
      {/* Edit button - bottom left */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit() }}
        className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md"
        title="Düzenle"
      >
        ✎
      </button>
    </div>
  )
}

interface GroupEditFormProps {
  group: { id: string; displayName: string; targetMeshNames: string[] }
  editGroupName: string
  setEditGroupName: (name: string) => void
  handleSaveGroupEdit: () => void
  handleRemoveMesh: (groupId: string, meshName: string) => void
  handleAddCurrentMeshToGroup: (groupId: string) => void
  selectedMeshName: string | null
  selectedMeshNames: string[]
  onCancel: () => void
}

function GroupEditForm({ 
  group, 
  editGroupName, 
  setEditGroupName, 
  handleSaveGroupEdit, 
  handleRemoveMesh, 
  handleAddCurrentMeshToGroup,
  selectedMeshName,
  selectedMeshNames,
  onCancel 
}: GroupEditFormProps) {
  return (
    <div className="space-y-3 mb-3 p-3 bg-editor-panel rounded-lg border border-blue-500/50">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Grup Adı</label>
        <input
          type="text"
          value={editGroupName}
          onChange={(e) => setEditGroupName(e.target.value)}
          className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
        />
      </div>
      
      <div>
        <label className="text-xs text-gray-400 block mb-1">Bağlı Meshler</label>
        <div className="flex flex-wrap gap-1">
          {group.targetMeshNames.map((meshName, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 bg-editor-bg rounded text-xs text-gray-300"
            >
              {meshName}
              <button
                onClick={() => handleRemoveMesh(group.id, meshName)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {(selectedMeshName || selectedMeshNames.length > 0) && (
          <button
            onClick={() => handleAddCurrentMeshToGroup(group.id)}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300"
          >
            + Seçili mesh'i ekle
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSaveGroupEdit}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs"
        >
          Kaydet
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded text-xs"
        >
          İptal
        </button>
      </div>
    </div>
  )
}

interface AddOptionPanelProps {
  groupId: string
  addMode: 'color' | 'texture' | 'preset' | null
  setAddMode: (mode: 'color' | 'texture' | 'preset' | null) => void
  newName: string
  setNewName: (name: string) => void
  newColor: string
  setNewColor: (color: string) => void
  texturePreview: string | null
  normalMapPreview: string | null
  roughnessMapPreview: string | null
  metalness: number
  setMetalness: (val: number) => void
  roughness: number
  setRoughness: (val: number) => void
  tilingX: number
  setTilingX: (val: number) => void
  tilingY: number
  setTilingY: (val: number) => void
  showPreAssets: boolean
  setShowPreAssets: (show: boolean) => void
  preAssetFilter: string
  setPreAssetFilter: (filter: string) => void
  preAssets: PreAssetMaterial[]
  selectedMaterialCategory: string | null
  setSelectedMaterialCategory: (category: string | null) => void
  handleTextureSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleNormalMapSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRoughnessMapSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleAddColor: (groupId: string) => void
  handleAddTexture: (groupId: string) => void
  handleAddPreAsset: (groupId: string, asset: PreAssetMaterial) => void
  handleAddBuiltInMaterial: (groupId: string, material: BuiltInMaterial) => void
  resetAddForm: () => void
}

function AddOptionPanel({
  groupId,
  addMode,
  setAddMode,
  newName,
  setNewName,
  newColor,
  setNewColor,
  texturePreview,
  normalMapPreview,
  roughnessMapPreview,
  metalness,
  setMetalness,
  roughness,
  setRoughness,
  tilingX,
  setTilingX,
  tilingY,
  setTilingY,
  showPreAssets,
  setShowPreAssets,
  preAssetFilter,
  setPreAssetFilter,
  preAssets,
  selectedMaterialCategory,
  setSelectedMaterialCategory,
  handleTextureSelect,
  handleNormalMapSelect,
  handleRoughnessMapSelect,
  handleAddColor,
  handleAddTexture,
  handleAddPreAsset,
  handleAddBuiltInMaterial,
  resetAddForm
}: AddOptionPanelProps) {
  return (
    <div className="mt-3 p-3 bg-editor-panel rounded-lg border border-gray-600">
      {/* Mode Selection */}
      {!addMode && (
        <div className="flex gap-2">
          <button
            onClick={() => setAddMode('preset')}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs"
          >
            🎨 Hazır Materyal
          </button>
          <button
            onClick={() => setAddMode('color')}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
          >
            🎨 Renk
          </button>
          <button
            onClick={() => setAddMode('texture')}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
          >
            🖼️ Doku
          </button>
        </div>
      )}

      {/* Color Picker */}
      {addMode === 'color' && (
        <ColorAddForm 
          newName={newName}
          setNewName={setNewName}
          newColor={newColor}
          setNewColor={setNewColor}
          onAdd={() => handleAddColor(groupId)}
          onCancel={resetAddForm}
        />
      )}

      {/* Texture Upload */}
      {(addMode === 'texture' || addMode === 'preset') && (
        <TextureAddForm 
          addMode={addMode}
          newName={newName}
          setNewName={setNewName}
          texturePreview={texturePreview}
          normalMapPreview={normalMapPreview}
          roughnessMapPreview={roughnessMapPreview}
          metalness={metalness}
          setMetalness={setMetalness}
          roughness={roughness}
          setRoughness={setRoughness}
          tilingX={tilingX}
          setTilingX={setTilingX}
          tilingY={tilingY}
          setTilingY={setTilingY}
          showPreAssets={showPreAssets}
          setShowPreAssets={setShowPreAssets}
          preAssetFilter={preAssetFilter}
          setPreAssetFilter={setPreAssetFilter}
          preAssets={preAssets}
          selectedMaterialCategory={selectedMaterialCategory}
          setSelectedMaterialCategory={setSelectedMaterialCategory}
          groupId={groupId}
          handleTextureSelect={handleTextureSelect}
          handleNormalMapSelect={handleNormalMapSelect}
          handleRoughnessMapSelect={handleRoughnessMapSelect}
          handleAddTexture={handleAddTexture}
          handleAddPreAsset={handleAddPreAsset}
          handleAddBuiltInMaterial={handleAddBuiltInMaterial}
          onCancel={resetAddForm}
        />
      )}
    </div>
  )
}

interface ColorAddFormProps {
  newName: string
  setNewName: (name: string) => void
  newColor: string
  setNewColor: (color: string) => void
  onAdd: () => void
  onCancel: () => void
}

function ColorAddForm({ newName, setNewName, newColor, setNewColor, onAdd, onCancel }: ColorAddFormProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Varyant adı..."
        className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
      />
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-gray-600"
        />
        <input
          type="text"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="flex-1 bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAdd}
          disabled={!newName.trim()}
          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs"
        >
          Ekle
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
        >
          İptal
        </button>
      </div>
    </div>
  )
}

interface TextureAddFormProps {
  addMode: 'texture' | 'preset'
  newName: string
  setNewName: (name: string) => void
  texturePreview: string | null
  normalMapPreview: string | null
  roughnessMapPreview: string | null
  metalness: number
  setMetalness: (val: number) => void
  roughness: number
  setRoughness: (val: number) => void
  tilingX: number
  setTilingX: (val: number) => void
  tilingY: number
  setTilingY: (val: number) => void
  showPreAssets: boolean
  setShowPreAssets: (show: boolean) => void
  preAssetFilter: string
  setPreAssetFilter: (filter: string) => void
  preAssets: PreAssetMaterial[]
  selectedMaterialCategory: string | null
  setSelectedMaterialCategory: (category: string | null) => void
  groupId: string
  handleTextureSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleNormalMapSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRoughnessMapSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleAddTexture: (groupId: string) => void
  handleAddPreAsset: (groupId: string, asset: PreAssetMaterial) => void
  handleAddBuiltInMaterial: (groupId: string, material: BuiltInMaterial) => void
  onCancel: () => void
}

function TextureAddForm({
  addMode,
  newName,
  setNewName,
  texturePreview,
  normalMapPreview,
  roughnessMapPreview,
  metalness,
  setMetalness,
  roughness,
  setRoughness,
  tilingX,
  setTilingX,
  tilingY,
  setTilingY,
  showPreAssets,
  setShowPreAssets,
  preAssetFilter,
  setPreAssetFilter,
  preAssets,
  selectedMaterialCategory,
  setSelectedMaterialCategory,
  groupId,
  handleTextureSelect,
  handleNormalMapSelect,
  handleRoughnessMapSelect,
  handleAddTexture,
  handleAddPreAsset,
  handleAddBuiltInMaterial,
  onCancel
}: TextureAddFormProps) {
  // Filter pre-assets
  const filteredPreAssets = preAssets.filter(asset => 
    !preAssetFilter || asset.name.toLowerCase().includes(preAssetFilter.toLowerCase()) ||
    asset.category.toLowerCase().includes(preAssetFilter.toLowerCase())
  )

  // Filter built-in materials by category
  const filteredBuiltInMaterials = selectedMaterialCategory 
    ? builtInMaterials.filter(m => m.category === selectedMaterialCategory)
    : builtInMaterials

  return (
    <div className="space-y-3">
      {/* Tab Toggle */}
      {addMode === 'texture' && (
        <div className="flex rounded-lg overflow-hidden border border-gray-600">
          <button
            onClick={() => setShowPreAssets(false)}
            className={`flex-1 py-2 text-xs ${!showPreAssets ? 'bg-purple-600 text-white' : 'bg-editor-bg text-gray-400'}`}
          >
            📁 Dosyadan Yükle
          </button>
          <button
            onClick={() => setShowPreAssets(true)}
            className={`flex-1 py-2 text-xs ${showPreAssets ? 'bg-purple-600 text-white' : 'bg-editor-bg text-gray-400'}`}
          >
            📦 Hazır Dokular
          </button>
        </div>
      )}

      {/* File Upload Tab */}
      {addMode === 'texture' && !showPreAssets && (
        <div className="space-y-2">
          {/* Texture Maps Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 text-xs">
            <p className="text-blue-400 font-medium mb-1">📌 Doku Haritaları Bilgisi:</p>
            <ul className="text-gray-300 space-y-0.5 text-[11px]">
              <li>• <span className="text-green-400">Ana Doku (Color)</span>: <span className="text-white">Zorunlu</span> - Temel renk/görünüm</li>
              <li>• <span className="text-yellow-400">Normal Map</span>: <span className="text-gray-400">İsteğe Bağlı</span> - Yüzey detayları</li>
              <li>• <span className="text-orange-400">Roughness Map</span>: <span className="text-gray-400">İsteğe Bağlı</span> - Pürüzlülük kontrolü</li>
            </ul>
            <p className="text-gray-400 mt-1 text-[10px]">💡 Sadece Ana Doku ile de çalışır. Diğerleri ekstra detay için.</p>
          </div>

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Varyant adı..."
            className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
          />
          
          <label className="flex items-center justify-center gap-2 py-6 border-2 border-dashed border-green-500/50 hover:border-green-400 rounded-lg cursor-pointer transition-colors bg-green-500/5" title="Zorunlu - Ana görünüm dokusu">
            <input
              type="file"
              accept="image/*"
              onChange={handleTextureSelect}
              className="hidden"
            />
            {texturePreview ? (
              <div className="flex items-center gap-2">
                <img src={texturePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                <span className="text-green-400 text-xs">✓ Yüklendi</span>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-green-400 text-sm">📁 Ana Doku (Color) *</span>
                <p className="text-gray-500 text-[10px] mt-1">Zorunlu alan</p>
              </div>
            )}
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col items-center justify-center gap-1 py-3 border border-dashed border-yellow-500/30 hover:border-yellow-400 rounded-lg cursor-pointer transition-colors bg-yellow-500/5" title="İsteğe bağlı - Yüzey detayları için">
              <input
                type="file"
                accept="image/*"
                onChange={handleNormalMapSelect}
                className="hidden"
              />
              {normalMapPreview ? (
                <div className="flex flex-col items-center">
                  <img src={normalMapPreview} alt="Normal" className="w-8 h-8 object-cover rounded" />
                  <span className="text-yellow-400 text-[10px]">✓</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-yellow-400/70 text-xs">Normal Map</span>
                  <p className="text-gray-500 text-[9px]">İsteğe bağlı</p>
                </div>
              )}
            </label>

            <label className="flex flex-col items-center justify-center gap-1 py-3 border border-dashed border-orange-500/30 hover:border-orange-400 rounded-lg cursor-pointer transition-colors bg-orange-500/5" title="İsteğe bağlı - Slider değeri yerine kullanılır">
              <input
                type="file"
                accept="image/*"
                onChange={handleRoughnessMapSelect}
                className="hidden"
              />
              {roughnessMapPreview ? (
                <div className="flex flex-col items-center">
                  <img src={roughnessMapPreview} alt="Roughness" className="w-8 h-8 object-cover rounded" />
                  <span className="text-orange-400 text-[10px]">✓</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-orange-400/70 text-xs">Roughness Map</span>
                  <p className="text-gray-500 text-[9px]">İsteğe bağlı</p>
                </div>
              )}
            </label>
          </div>

          {/* Roughness Slider - below roughness map */}
          <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded">
            <label className="text-xs text-orange-400 block mb-1">
              Pürüzlülük (Roughness): {roughness.toFixed(1)}
              {roughnessMapPreview && <span className="text-gray-400 ml-1 text-[10px]">• Map ile birlikte kullanılır</span>}
            </label>
            <input 
              type="range" 
              min="0" max="1" step="0.05"
              value={roughness}
              onChange={(e) => setRoughness(parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              {roughnessMapPreview 
                ? "💡 Roughness Map yüklü - slider genel çarpan olarak çalışır" 
                : "💡 Roughness Map yoksa bu değer doğrudan kullanılır"}
            </p>
          </div>

          {/* Metalness Slider */}
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
            <label className="text-xs text-blue-400 block mb-1">Metalik: {metalness.toFixed(1)}</label>
            <input 
              type="range" 
              min="0" max="1" step="0.05"
              value={metalness}
              onChange={(e) => setMetalness(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Döşeme X ({tilingX})</label>
              <input 
                type="number" 
                min="0.1" step="0.1"
                value={tilingX}
                onChange={(e) => setTilingX(parseFloat(e.target.value))}
                className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Döşeme Y ({tilingY})</label>
              <input 
                type="number" 
                min="0.1" step="0.1"
                value={tilingY}
                onChange={(e) => setTilingY(parseFloat(e.target.value))}
                className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1 text-white text-xs"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleAddTexture(groupId)}
              disabled={!newName.trim() || !texturePreview}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs"
            >
              Ekle
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Pre-assets Tab */}
      {addMode === 'texture' && showPreAssets && (
        <div className="space-y-2">
          <input
            type="text"
            value={preAssetFilter}
            onChange={(e) => setPreAssetFilter(e.target.value)}
            placeholder="Doku ara..."
            className="w-full bg-editor-bg border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
          />
          
          <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
            {filteredPreAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleAddPreAsset(groupId, asset)}
                className="aspect-square rounded overflow-hidden border border-gray-600 hover:border-purple-400 transition-colors"
                title={asset.name}
              >
                <img 
                  src={asset.thumbnail || asset.textureUrl} 
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          
          <button
            onClick={onCancel}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
          >
            İptal
          </button>
        </div>
      )}

      {/* Preset Materials Tab */}
      {addMode === 'preset' && (
        <div className="space-y-2">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedMaterialCategory(null)}
              className={`px-2 py-1 rounded text-xs ${!selectedMaterialCategory ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Tümü
            </button>
            {materialCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedMaterialCategory(cat.id)}
                className={`px-2 py-1 rounded text-xs ${selectedMaterialCategory === cat.id ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          
          {/* Materials Grid */}
          <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
            {filteredBuiltInMaterials.map((material) => (
              <button
                key={material.id}
                onClick={() => handleAddBuiltInMaterial(groupId, material)}
                className="aspect-square rounded overflow-hidden border border-gray-600 hover:border-purple-400 transition-colors relative group"
                title={material.name}
                style={{
                  background: material.metalness > 0.5
                    ? `linear-gradient(135deg, ${adjustBrightness(material.color, 30)} 0%, ${material.color} 50%, ${adjustBrightness(material.color, -30)} 100%)`
                    : material.color
                }}
              >
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                  {material.name}
                </span>
              </button>
            ))}
          </div>
          
          <button
            onClick={onCancel}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
          >
            İptal
          </button>
        </div>
      )}
    </div>
  )
}

// Helper function (duplicate to avoid circular import)
function adjustBrightness(hex: string, percent: number) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}
