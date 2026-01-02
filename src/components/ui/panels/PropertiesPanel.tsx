/**
 * Properties Panel - Object transformation and selection management
 */

import { useMemo, useCallback } from 'react'
import { useEditorStore } from '../../../store/useEditorStore'
import { useSceneStore } from '../../../store/useSceneStore'
import { useVariantsStore } from '../../../store/useVariantsStore'
import { DraggableNumberInput, EmptyState } from './shared'

export default function PropertiesPanel() {
  const { 
    selectedObject, 
    selectedObjects,
    selectedMeshName,
    selectedMeshNames,
    selectedObjectId,
    clearSelection,
    setActiveTool,
    activeTool,
    transformSpace,
    toggleTransformSpace,
    setActivePanel
  } = useEditorStore()
  const { player, updatePlayer } = useSceneStore()
  const { createGroup } = useVariantsStore()
  
  const isMultiSelect = selectedObjects.length > 1
  
  // Collision mesh kontrolü - mesh name kullan (daha güvenilir)
  const collisionMeshIds = useMemo(() => player.collisionMeshIds || [], [player.collisionMeshIds])
  const meshIdForCollision = selectedMeshName || selectedObjectId || ''
  
  const isCollisionEnabled = useMemo(() => {
    if (isMultiSelect) {
      return selectedMeshNames.every(name => collisionMeshIds.includes(name))
    }
    return meshIdForCollision ? collisionMeshIds.includes(meshIdForCollision) : false
  }, [isMultiSelect, selectedMeshNames, meshIdForCollision, collisionMeshIds])
  
  const toggleCollision = useCallback(() => {
    const currentIds = [...collisionMeshIds]
    
    if (isMultiSelect) {
      // Multi-select: toggle all
      const allEnabled = selectedMeshNames.every(name => currentIds.includes(name))
      if (allEnabled) {
        // Remove all
        const newIds = currentIds.filter(id => !selectedMeshNames.includes(id))
        updatePlayer({ collisionMeshIds: newIds })
      } else {
        // Add all missing
        const newIds = [...new Set([...currentIds, ...selectedMeshNames])]
        updatePlayer({ collisionMeshIds: newIds })
      }
    } else if (meshIdForCollision) {
      // Single select
      if (currentIds.includes(meshIdForCollision)) {
        updatePlayer({ collisionMeshIds: currentIds.filter(id => id !== meshIdForCollision) })
      } else {
        updatePlayer({ collisionMeshIds: [...currentIds, meshIdForCollision] })
      }
    }
  }, [isMultiSelect, selectedMeshNames, meshIdForCollision, collisionMeshIds, updatePlayer])

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
        <CollisionToggle 
          isEnabled={isCollisionEnabled}
          onToggle={toggleCollision}
          description="Player bu mesh'lere çarpacak"
        />
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
            onChange={(v) => { selectedObject!.position.x = v }}
          />
          <DraggableNumberInput 
            label="Y" 
            value={position.y} 
            color="green" 
            onChange={(v) => { selectedObject!.position.y = v }}
          />
          <DraggableNumberInput 
            label="Z" 
            value={position.z} 
            color="blue" 
            onChange={(v) => { selectedObject!.position.z = v }}
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
            onChange={(v) => { selectedObject!.rotation.x = v * Math.PI / 180 }}
          />
          <DraggableNumberInput 
            label="Y" 
            value={(rotation.y * 180 / Math.PI)} 
            color="green" 
            step={1}
            onChange={(v) => { selectedObject!.rotation.y = v * Math.PI / 180 }}
          />
          <DraggableNumberInput 
            label="Z" 
            value={(rotation.z * 180 / Math.PI)} 
            color="blue" 
            step={1}
            onChange={(v) => { selectedObject!.rotation.z = v * Math.PI / 180 }}
          />
        </div>
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
            onChange={(v) => { selectedObject!.scale.x = Math.max(0.001, v) }}
          />
          <DraggableNumberInput 
            label="Y" 
            value={scale.y} 
            color="green" 
            step={0.01}
            precision={3}
            onChange={(v) => { selectedObject!.scale.y = Math.max(0.001, v) }}
          />
          <DraggableNumberInput 
            label="Z" 
            value={scale.z} 
            color="blue" 
            step={0.01}
            precision={3}
            onChange={(v) => { selectedObject!.scale.z = Math.max(0.001, v) }}
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="pt-4 border-t border-gray-700 space-y-3">
        {/* Collision Toggle */}
        <CollisionToggle 
          isEnabled={isCollisionEnabled}
          onToggle={toggleCollision}
          description="Player bu mesh'e çarpacak"
        />
        
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

interface CollisionToggleProps {
  isEnabled: boolean
  onToggle: () => void
  description: string
}

function CollisionToggle({ isEnabled, onToggle, description }: CollisionToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer bg-editor-bg rounded-lg p-3">
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
      />
      <div>
        <span className="text-gray-300 text-sm">🧱 Collision Aktif</span>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  )
}
