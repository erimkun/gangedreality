import { useState, useEffect } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '@/store/useEditorStore'
import { useSceneStore } from '@/store/useSceneStore'
import { useInteractionsStore } from '@/store/useInteractionsStore'

// Type for mesh info
type MeshInfo = {
  id: string
  name: string
  object: THREE.Object3D
  visible: boolean
  type: 'mesh' | 'group' | 'light' | 'zone'
}

interface LeftPanelProps {
  onModelUpload: () => void
}

export default function LeftPanel({ onModelUpload }: LeftPanelProps) {
  const { 
    sceneMeshes, 
    selectedObjectIds, 
    hiddenMeshIds,
    selectObject,
    toggleMeshVisibility,
    setActivePanel
  } = useEditorStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['meshes', 'lights', 'zones']))
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-scroll to selected item and expand its group
  useEffect(() => {
    if (selectedObjectIds.length === 0) return
    
    const selectedId = selectedObjectIds[selectedObjectIds.length - 1]
    const selectedMesh = sceneMeshes.find(m => m.id === selectedId)
    
    if (selectedMesh) {
      const meshType = selectedMesh.type
      const groupName = (meshType === 'mesh' || meshType === 'group') ? 'meshes' : 
                        meshType === 'light' ? 'lights' : 'zones'
      
      if (!expandedGroups.has(groupName)) {
        setExpandedGroups(prev => new Set([...prev, groupName]))
      }
      
      setTimeout(() => {
        const element = document.getElementById(`outliner-item-${selectedId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
    }
  }, [selectedObjectIds, sceneMeshes, expandedGroups])

  // Filter meshes by search
  const filteredMeshes = sceneMeshes.filter(mesh => 
    mesh.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group meshes by type
  const groupedMeshes = {
    meshes: filteredMeshes.filter(m => m.type === 'mesh' || m.type === 'group'),
    lights: filteredMeshes.filter(m => m.type === 'light'),
    zones: filteredMeshes.filter(m => m.type === 'zone')
  }

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  const handleSelect = (mesh: typeof sceneMeshes[0], e: React.MouseEvent) => {
    const addToSelection = e.ctrlKey || e.metaKey || e.shiftKey
    selectObject(mesh.object, mesh.id, mesh.name, addToSelection)
  }

  const handleVisibilityToggle = (meshId: string) => {
    toggleMeshVisibility(meshId)
  }

  // Add handlers
  const handleAddLight = (type: 'directional' | 'point' | 'spot') => {
    useSceneStore.getState().addLight(type)
  }

  const handleAddZone = () => {
    useInteractionsStore.getState().addZone([0, 1.5, 0])
  }

  if (isCollapsed) {
    return (
      <div className="absolute left-4 top-20 bg-[#111618]/90 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-3 text-white/70 hover:text-white transition-colors"
          title="Paneli Aç"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="absolute left-4 top-20 bottom-20 w-72 bg-[#111618]/90 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <span className="text-white font-medium text-sm">Scene Outliner</span>
        </div>
        <button 
          onClick={() => setIsCollapsed(true)}
          className="size-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Paneli Küçült"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-white/5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Obje ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Mesh List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Meshes Group */}
        <MeshGroup
          title="Meshler"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          items={groupedMeshes.meshes}
          isExpanded={expandedGroups.has('meshes')}
          onToggle={() => toggleGroup('meshes')}
          selectedIds={selectedObjectIds}
          hiddenIds={hiddenMeshIds}
          onSelect={handleSelect}
          onToggleVisibility={handleVisibilityToggle}
        />

        {/* Lights Group */}
        <MeshGroup
          title="Işıklar"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
          items={groupedMeshes.lights}
          isExpanded={expandedGroups.has('lights')}
          onToggle={() => toggleGroup('lights')}
          selectedIds={selectedObjectIds}
          hiddenIds={hiddenMeshIds}
          onSelect={handleSelect}
          onToggleVisibility={handleVisibilityToggle}
        />

        {/* Zones Group */}
        <MeshGroup
          title="Etkileşim Noktaları"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          items={groupedMeshes.zones}
          isExpanded={expandedGroups.has('zones')}
          onToggle={() => toggleGroup('zones')}
          selectedIds={selectedObjectIds}
          hiddenIds={hiddenMeshIds}
          onSelect={handleSelect}
          onToggleVisibility={handleVisibilityToggle}
        />

        {filteredMeshes.length === 0 && (
          <p className="text-white/30 text-sm text-center py-8">
            {searchQuery ? 'Sonuç bulunamadı' : 'Sahne boş'}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="px-3 py-2 border-t border-white/5 text-xs text-white/30">
        {sceneMeshes.length} obje • {selectedObjectIds.length} seçili
      </div>

      {/* Add Buttons - Bottom Section */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Sahneye Ekle</p>
        
        <div className="grid grid-cols-2 gap-2">
          <AddButton 
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            label="Model"
            onClick={onModelUpload}
          />
          <AddButton 
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
            label="Işık"
            onClick={() => handleAddLight('directional')}
          />
          <AddButton 
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="Etkileşim"
            onClick={handleAddZone}
          />
          <AddButton 
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
            label="Varyant"
            onClick={() => setActivePanel('variants')}
          />
        </div>
      </div>
    </div>
  )
}

// Add Button Component
function AddButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 rounded-lg text-white/70 hover:text-white transition-all text-sm"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// Mesh Group Component
interface MeshGroupProps {
  title: string
  icon: React.ReactNode
  items: MeshInfo[]
  isExpanded: boolean
  onToggle: () => void
  selectedIds: string[]
  hiddenIds: Set<string>
  onSelect: (mesh: MeshInfo, e: React.MouseEvent) => void
  onToggleVisibility: (id: string) => void
}

function MeshGroup({ 
  title, 
  icon, 
  items, 
  isExpanded, 
  onToggle, 
  selectedIds, 
  hiddenIds,
  onSelect, 
  onToggleVisibility 
}: MeshGroupProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
      >
        <svg 
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-white/40">{icon}</span>
        <span className="flex-1 text-left">{title}</span>
        <span className="text-xs text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{items.length}</span>
      </button>

      {isExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {items.map(mesh => {
            const isSelected = selectedIds.includes(mesh.id)
            const isHidden = hiddenIds.has(mesh.id)

            return (
              <div
                key={mesh.id}
                id={`outliner-item-${mesh.id}`}
                className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-primary/20 text-white border border-primary/30' 
                    : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
                } ${isHidden ? 'opacity-40' : ''}`}
                onClick={(e) => onSelect(mesh, e)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleVisibility(mesh.id)
                  }}
                  className={`size-5 rounded flex items-center justify-center transition-colors ${
                    isHidden ? 'text-white/30' : 'text-white/50 hover:text-white'
                  }`}
                  title={isHidden ? 'Göster' : 'Gizle'}
                >
                  {isHidden ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                <span className="flex-1 truncate">{mesh.name || 'Unnamed'}</span>
                {isSelected && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
