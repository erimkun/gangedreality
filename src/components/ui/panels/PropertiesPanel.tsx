/**
 * Properties Panel - Object transformation and selection management
 */

import { useMemo, useCallback, useReducer } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '../../../store/useEditorStore'
import { useProjectStore } from '../../../store/useProjectStore'
import { useVariantsStore } from '../../../store/useVariantsStore'
import { useHotspotStore } from '../../../store/useHotspotStore'
import type { MeshMaterialOverride } from '../../../types'
import { DraggableNumberInput, EmptyState } from './shared'

export default function PropertiesPanel() {
  const { 
    selectedObject, 
    selectedObjects,
    selectedMeshName,
    selectedMeshNames,
    selectedObjectId,
    sceneMeshes,
    clearSelection,
    setActiveTool,
    activeTool,
    transformSpace,
    toggleTransformSpace,
    setActivePanel
  } = useEditorStore()
  const { createGroup } = useVariantsStore()
  const { settings: hotspotSettings, toggleWalkableMesh } = useHotspotStore()
  const models = useProjectStore(state => state.assets.models)
  const updateModel = useProjectStore(state => state.updateModel)
  
  // Force re-render after direct Three.js mutation (must be before any early returns)
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)
  
  const isMultiSelect = selectedObjects.length > 1
  
  const meshIdForCollision = selectedMeshName || selectedObjectId || ''
  const selectedMeshInfo = useMemo(
    () => sceneMeshes.find(mesh => mesh.id === selectedObjectId),
    [sceneMeshes, selectedObjectId]
  )
  const selectedModel = useMemo(
    () => models.find(model => model.id === selectedMeshInfo?.parentId),
    [models, selectedMeshInfo?.parentId]
  )
  const selectedMeshKey = selectedObject?.name || selectedMeshName || ''
  const selectedMaterial = useMemo(() => {
    if (!(selectedObject instanceof THREE.Mesh) || Array.isArray(selectedObject.material)) {
      return null
    }
    return selectedObject.material instanceof THREE.MeshStandardMaterial
      ? selectedObject.material
      : null
  }, [selectedObject])
  const activeMaterialOverride = useMemo(
    () => (selectedModel?.meshMaterialOverrides?.[selectedMeshKey] || {}) as MeshMaterialOverride,
    [selectedModel, selectedMeshKey]
  )

  // Walkable Mesh Logic (Hotspot Navigation)
  const walkableMeshIds = useMemo(() => hotspotSettings.walkableMeshIds || [], [hotspotSettings.walkableMeshIds])
  
  const isWalkableEnabled = useMemo(() => {
    if (isMultiSelect) {
      return selectedMeshNames.every(name => walkableMeshIds.includes(name))
    }
    return meshIdForCollision ? walkableMeshIds.includes(meshIdForCollision) : false
  }, [isMultiSelect, selectedMeshNames, meshIdForCollision, walkableMeshIds])

  const handleToggleWalkable = useCallback(() => {
    if (isMultiSelect) {
      selectedMeshNames.forEach(name => toggleWalkableMesh(name))
    } else if (meshIdForCollision) {
      toggleWalkableMesh(meshIdForCollision)
    }
  }, [isMultiSelect, selectedMeshNames, meshIdForCollision, toggleWalkableMesh])
  
  const handleCreateVariantGroup = () => {
    const meshNames = selectedMeshNames.length > 0 ? selectedMeshNames : (selectedMeshName ? [selectedMeshName] : [])
    if (meshNames.length > 0) {
      const groupName = meshNames.length > 1 
        ? `${meshNames.length} Mesh Grubu` 
        : `${meshNames[0]} Grubu`
      createGroup(groupName, meshNames)
      // Varyantlar paneline geç
      setActivePanel('variants')
    }
  }

  const updateMaterialOverride = useCallback((updates: Partial<MeshMaterialOverride>) => {
    if (!selectedModel || !selectedMeshKey) return

    const currentOverrides = selectedModel.meshMaterialOverrides || {}
    const nextOverride: MeshMaterialOverride = {
      ...(currentOverrides[selectedMeshKey] || {}),
      ...updates
    }

    updateModel(selectedModel.id, {
      meshMaterialOverrides: {
        ...currentOverrides,
        [selectedMeshKey]: nextOverride
      }
    })
  }, [selectedModel, selectedMeshKey, updateModel])

  const resetMaterialOverride = useCallback(() => {
    if (!selectedModel || !selectedMeshKey) return

    const nextOverrides = { ...(selectedModel.meshMaterialOverrides || {}) }
    delete nextOverrides[selectedMeshKey]

    updateModel(selectedModel.id, {
      meshMaterialOverrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : undefined
    })
  }, [selectedModel, selectedMeshKey, updateModel])

  const handleMaterialFile = useCallback((slot: 'textureUrl' | 'normalMapUrl' | 'roughnessMapUrl', file?: File | null) => {
    if (!file) return

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `material_${Date.now()}_${slot}_${sanitizedName}`
    const previewUrl = URL.createObjectURL(file)
    const win = window as Window & {
      __loadedTextures?: Map<string, File>
      __blobUrlToFileName?: Map<string, string>
    }

    if (!win.__loadedTextures) win.__loadedTextures = new Map()
    if (!win.__blobUrlToFileName) win.__blobUrlToFileName = new Map()

    win.__loadedTextures.set(fileName, file)
    win.__blobUrlToFileName.set(previewUrl, `textures/${fileName}`)

    updateMaterialOverride({ [slot]: previewUrl })
  }, [updateMaterialOverride])

  const getMapStatus = useCallback((overrideUrl: string | null | undefined, map: THREE.Texture | null) => {
    if (overrideUrl === null) return 'Kapalı'
    if (overrideUrl) return 'Özel doku'
    if (map) return 'Orijinal doku'
    return 'Yok'
  }, [])
  
  if (!selectedObject && selectedObjects.length === 0) {
    return (
      <EmptyState 
        icon="👆"
        title="Düzenlemek için bir obje seçin"
        description="Ctrl+A = Tümünü Seç"
      />
    )
  }
  
  // Multi-select view
  if (isMultiSelect) {
    // Calculate bounding box center for all selected objects
    let centerX = 0, centerY = 0, centerZ = 0
    selectedObjects.forEach(obj => {
      centerX += obj.position.x
      centerY += obj.position.y
      centerZ += obj.position.z
    })
    centerX /= selectedObjects.length
    centerY /= selectedObjects.length
    centerZ /= selectedObjects.length
    
    return (
      <div className="space-y-4">
        {/* Multi-select header */}
        <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-lg p-3 border border-purple-500/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">🎯 Çoklu Seçim</h3>
              <p className="text-purple-300 text-sm">{selectedObjects.length} obje seçili</p>
            </div>
            <button 
              onClick={clearSelection}
              className="text-gray-400 hover:text-white text-sm px-2 py-1 bg-gray-700 rounded"
            >
              Temizle
            </button>
          </div>
        </div>
        
        {/* Selected objects list */}
        <div className="bg-editor-bg rounded-lg p-3 max-h-32 overflow-y-auto">
          <h4 className="text-gray-300 text-xs mb-2 uppercase tracking-wider">Seçili Objeler</h4>
          <div className="space-y-1">
            {selectedMeshNames.map((name, idx) => (
              <div key={idx} className="text-gray-400 text-xs truncate flex items-center gap-1">
                <span className="text-green-400">●</span> {name}
              </div>
            ))}
          </div>
        </div>
        {/* Walkable Toggle (Hotspot Navigation) */}
        <div className="bg-editor-bg border border-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-300">Yürünebilir Alan (Navigasyon)</span>
            <button
              onClick={handleToggleWalkable}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                isWalkableEnabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                isWalkableEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          <p className="text-[10px] text-gray-500">
            Aktif edilirse, oyuncu bu objelerin üzerinde yürüyebilir (imleç görünür).
          </p>
        </div>        
        {/* Center position - editable, moves all selected objects */}
        <div className="bg-editor-bg rounded-lg p-3">
          <h4 className="text-gray-300 text-sm mb-2">Merkez Nokta (Toplu Taşı)</h4>
          <div className="grid grid-cols-3 gap-2">
            <DraggableNumberInput 
              label="X" 
              value={centerX} 
              color="red" 
              onChange={(v) => {
                const delta = v - centerX
                selectedObjects.forEach(obj => { obj.position.x += delta })
              }}
            />
            <DraggableNumberInput 
              label="Y" 
              value={centerY} 
              color="green" 
              onChange={(v) => {
                const delta = v - centerY
                selectedObjects.forEach(obj => { obj.position.y += delta })
              }}
            />
            <DraggableNumberInput 
              label="Z" 
              value={centerZ} 
              color="blue" 
              onChange={(v) => {
                const delta = v - centerZ
                selectedObjects.forEach(obj => { obj.position.z += delta })
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 Sürükle veya yaz: tüm objeler birlikte hareket eder</p>
        </div>
        
        {/* Transform Tools */}
        <TransformTools 
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          transformSpace={transformSpace}
          toggleTransformSpace={toggleTransformSpace}
        />
        
        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>W/G = Taşı | E = Döndür | R/S = Ölçekle</p>
          <p>Q = Uzay Değiştir | Esc = Seçimi Temizle</p>
        </div>
        
        {/* Collision Toggle */}
        {/* <CollisionToggle 
          isEnabled={isCollisionEnabled}
          onToggle={toggleCollision}
          description="Player bu mesh'lere çarpacak"
        /> */}
      </div>
    )
  }
  
  // Single select view
  const position = selectedObject!.position
  const rotation = selectedObject!.rotation
  const scale = selectedObject!.scale
  
  return (
    <div className="space-y-4">
      <div className="bg-editor-bg rounded-lg p-3">
        <h3 className="text-white font-medium mb-2">Seçili Obje</h3>
        <p className="text-gray-400 text-sm truncate">{selectedMeshName || 'İsimsiz'}</p>
      </div>
      
      {/* Transform Tools */}
      <TransformTools 
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        transformSpace={transformSpace}
        toggleTransformSpace={toggleTransformSpace}
      />
      
      {/* Position */}
      <div className="bg-editor-bg rounded-lg p-3">
        <h4 className="text-gray-300 text-sm mb-2">Konum</h4>
        <div className="grid grid-cols-3 gap-2">
          <DraggableNumberInput 
            label="X" 
            value={position.x} 
            color="red" 
            onChange={(v) => { selectedObject!.position.x = v; forceUpdate() }}
          />
          <DraggableNumberInput 
            label="Y" 
            value={position.y} 
            color="green" 
            onChange={(v) => { selectedObject!.position.y = v; forceUpdate() }}
          />
          <DraggableNumberInput 
            label="Z" 
            value={position.z} 
            color="blue" 
            onChange={(v) => { selectedObject!.position.z = v; forceUpdate() }}
          />
        </div>
      </div>
      
      {/* Rotation */}
      <div className="bg-editor-bg rounded-lg p-3">
        <h4 className="text-gray-300 text-sm mb-2">Rotasyon (°)</h4>
        <div className="grid grid-cols-3 gap-2">
          <DraggableNumberInput 
            label="X" 
            value={(rotation.x * 180 / Math.PI)} 
            color="red" 
            step={1}
            onChange={(v) => { selectedObject!.rotation.x = v * Math.PI / 180; forceUpdate() }}
          />
          <DraggableNumberInput 
            label="Y" 
            value={(rotation.y * 180 / Math.PI)} 
            color="green" 
            step={1}
            onChange={(v) => { selectedObject!.rotation.y = v * Math.PI / 180; forceUpdate() }}
          />
          <DraggableNumberInput 
            label="Z" 
            value={(rotation.z * 180 / Math.PI)} 
            color="blue" 
            step={1}
            onChange={(v) => { selectedObject!.rotation.z = v * Math.PI / 180; forceUpdate() }}
          />
        </div>
      </div>

      {/* Walkable Toggle (Hotspot Navigation) */}
      <div className="bg-editor-bg border border-white/10 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-300">Yürünebilir Alan (Navigasyon)</span>
          <button
            onClick={handleToggleWalkable}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              isWalkableEnabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
              isWalkableEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
        <p className="text-[10px] text-gray-500">
          Aktif edilirse, oyuncu bu objenin üzerinde yürüyebilir (imleç görünür).
        </p>
      </div>
      
      {/* Scale */}
      <div className="bg-editor-bg rounded-lg p-3">
        <h4 className="text-gray-300 text-sm mb-2">Ölçek</h4>
        <div className="grid grid-cols-3 gap-2">
          <DraggableNumberInput 
            label="X" 
            value={scale.x} 
            color="red" 
            step={0.01}
            precision={3}
            onChange={(v) => { selectedObject!.scale.x = Math.max(0.001, v); forceUpdate() }}
          />
          <DraggableNumberInput 
            label="Y" 
            value={scale.y} 
            color="green" 
            step={0.01}
            precision={3}
            onChange={(v) => { selectedObject!.scale.y = Math.max(0.001, v); forceUpdate() }}
          />
          <DraggableNumberInput 
            label="Z" 
            value={scale.z} 
            color="blue" 
            step={0.01}
            precision={3}
            onChange={(v) => { selectedObject!.scale.z = Math.max(0.001, v); forceUpdate() }}
          />
        </div>
      </div>

      {selectedMaterial && selectedModel && selectedMeshKey && (
        <div className="bg-editor-bg rounded-lg p-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-gray-300 text-sm">Malzeme</h4>
              <p className="text-[11px] text-gray-500 mt-1 break-all">{selectedMeshKey}</p>
            </div>
            <button
              onClick={resetMaterialOverride}
              className="text-xs text-amber-300 hover:text-amber-200"
            >
              Defaulta Al
            </button>
          </div>

          <div className="grid grid-cols-[auto,1fr] items-center gap-3">
            <label className="text-xs text-gray-400">Renk</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeMaterialOverride.color || `#${selectedMaterial.color.getHexString()}`}
                onChange={(e) => updateMaterialOverride({ color: e.target.value })}
                className="h-9 w-14 rounded border border-white/10 bg-transparent"
              />
              <span className="text-xs text-gray-500">{activeMaterialOverride.color || `#${selectedMaterial.color.getHexString()}`}</span>
            </div>

            <label className="text-xs text-gray-400">Metalness</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={activeMaterialOverride.metalness ?? selectedMaterial.metalness}
                onChange={(e) => updateMaterialOverride({ metalness: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="w-10 text-right text-xs text-gray-400">{(activeMaterialOverride.metalness ?? selectedMaterial.metalness).toFixed(2)}</span>
            </div>

            <label className="text-xs text-gray-400">Roughness</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={activeMaterialOverride.roughness ?? selectedMaterial.roughness}
                onChange={(e) => updateMaterialOverride({ roughness: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="w-10 text-right text-xs text-gray-400">{(activeMaterialOverride.roughness ?? selectedMaterial.roughness).toFixed(2)}</span>
            </div>
          </div>

          <MaterialMapField
            label="Base Texture"
            status={getMapStatus(activeMaterialOverride.textureUrl, selectedMaterial.map)}
            value={activeMaterialOverride.textureUrl}
            onUpload={(file) => handleMaterialFile('textureUrl', file)}
            onClear={() => updateMaterialOverride({ textureUrl: null })}
          />

          <MaterialMapField
            label="Normal Map"
            status={getMapStatus(activeMaterialOverride.normalMapUrl, selectedMaterial.normalMap)}
            value={activeMaterialOverride.normalMapUrl}
            onUpload={(file) => handleMaterialFile('normalMapUrl', file)}
            onClear={() => updateMaterialOverride({ normalMapUrl: null })}
          />

          <MaterialMapField
            label="Roughness Map"
            status={getMapStatus(activeMaterialOverride.roughnessMapUrl, selectedMaterial.roughnessMap)}
            value={activeMaterialOverride.roughnessMapUrl}
            onUpload={(file) => handleMaterialFile('roughnessMapUrl', file)}
            onClear={() => updateMaterialOverride({ roughnessMapUrl: null })}
          />
        </div>
      )}
      
      {/* Actions */}
      <div className="pt-4 border-t border-gray-700 space-y-3">
        {/* Collision Toggle */}
        {/* <CollisionToggle 
          isEnabled={isCollisionEnabled}
          onToggle={toggleCollision}
          description="Player bu mesh'e çarpacak"
        /> */}
        
        <button 
          onClick={handleCreateVariantGroup}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors text-sm"
        >
          🎨 Varyasyon Grubu Yap
        </button>
      </div>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

interface TransformToolsProps {
  activeTool: string
  setActiveTool: (tool: 'translate' | 'rotate' | 'scale') => void
  transformSpace: string
  toggleTransformSpace: () => void
}

function TransformTools({ activeTool, setActiveTool, transformSpace, toggleTransformSpace }: TransformToolsProps) {
  return (
    <div className="bg-editor-bg rounded-lg p-3">
      <h4 className="text-gray-300 text-sm mb-2">Dönüşüm Aracı</h4>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveTool('translate')}
          className={`py-2 rounded text-sm transition-colors ${
            activeTool === 'translate' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ↔️ Taşı
        </button>
        <button
          onClick={() => setActiveTool('rotate')}
          className={`py-2 rounded text-sm transition-colors ${
            activeTool === 'rotate' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔄 Döndür
        </button>
        <button
          onClick={() => setActiveTool('scale')}
          className={`py-2 rounded text-sm transition-colors ${
            activeTool === 'scale' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ⬜ Ölçekle
        </button>
      </div>
      
      <button
        onClick={toggleTransformSpace}
        className="w-full mt-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs"
      >
        Uzay: {transformSpace === 'world' ? '🌍 Dünya' : '📦 Lokal'}
      </button>
    </div>
  )
}

interface MaterialMapFieldProps {
  label: string
  status: string
  value?: string | null
  onUpload: (file?: File | null) => void
  onClear: () => void
}

function MaterialMapField({ label, status, value, onUpload, onClear }: MaterialMapFieldProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-gray-300">{label}</div>
          <div className="text-[11px] text-gray-500 mt-1">{status}</div>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded bg-blue-600 px-2.5 py-1.5 text-xs text-white hover:bg-blue-500">
            Yükle
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onUpload(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
          <button
            onClick={onClear}
            className="rounded bg-white/10 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/15"
          >
            Temizle
          </button>
        </div>
      </div>
      {value && (
        <div className="mt-2 truncate text-[11px] text-blue-300">{value}</div>
      )}
    </div>
  )
}
