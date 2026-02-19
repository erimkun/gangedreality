import { useState, useEffect, useMemo, useRef } from 'react'
import { useVariantsStore } from '@/store/useVariantsStore'
import { useSearchParams } from 'react-router-dom'

import { toast } from '@/store/useToastStore'

interface ConfiguratorPanelProps {
  isOpen?: boolean
  onToggle?: () => void
}

export default function ConfiguratorPanel({ isOpen = true, onToggle }: ConfiguratorPanelProps) {
  const { configurableGroups, selectOption } = useVariantsStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null)

  // Filter out groups with no options (memoized to prevent infinite loops)
  const visibleGroups = useMemo(
    () => configurableGroups.filter(group => group.options.length > 0),
    [configurableGroups]
  )

  // Auto expand all groups on mount if there are few groups
  useEffect(() => {
    if (visibleGroups.length > 0 && visibleGroups.length <= 3) {
      setExpandedGroups(new Set(visibleGroups.map(g => g.id)))
    }
  }, [visibleGroups.length]) // Only depend on length, not the array itself

  // Listen for hotspot clicks from 3D model
  useEffect(() => {
    const handleHotspotClick = (e: CustomEvent<{ groupId: string; meshName: string }>) => {
      const { groupId } = e.detail
      // Expand and highlight the clicked group
      setExpandedGroups(prev => new Set([...prev, groupId]))
      setHighlightedGroup(groupId)
      
      // Remove highlight after a short delay
      setTimeout(() => setHighlightedGroup(null), 2000)
    }
    
    window.addEventListener('variant-hotspot-click', handleHotspotClick as EventListener)
    return () => {
      window.removeEventListener('variant-hotspot-click', handleHotspotClick as EventListener)
    }
  }, [])

  // Initialize from URL params — must wait for groups to load
  const appliedConfigRef = useRef(false)
  useEffect(() => {
    const configParam = searchParams.get('config')
    if (!configParam || visibleGroups.length === 0 || appliedConfigRef.current) return
    try {
      const selections = JSON.parse(decodeURIComponent(escape(atob(configParam)))) as Record<string, number>
      Object.entries(selections).forEach(([groupId, optionIndex]) => {
        selectOption(groupId, optionIndex)
      })
      appliedConfigRef.current = true
    } catch (e) {
      console.error('Failed to parse config from URL', e)
    }
  }, [visibleGroups.length, searchParams, selectOption])

  // Update URL when selection changes
  const handleSelectOption = (groupId: string, optionIndex: number) => {
    selectOption(groupId, optionIndex)
    
    // Build current selections
    const selections: Record<string, number> = {}
    configurableGroups.forEach(group => {
      if (group.id === groupId) {
        selections[group.id] = optionIndex
      } else {
        selections[group.id] = group.selectedOptionIndex ?? 0
      }
    })
    
    // Update URL with base64 encoded config (safe for Turkish characters)
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(selections))))
    setSearchParams(prev => {
      prev.set('config', encoded)
      return prev
    }, { replace: true })
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Copy shareable link
  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link panoya kopyalandı!')
  }

  if (visibleGroups.length === 0) {
    return null // No variants to show
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute right-4 bottom-4 bg-[#111618]/80 backdrop-blur-xl p-3 rounded-xl border border-white/10 text-white hover:bg-[#111618] hover:border-primary/30 transition-all shadow-xl"
        title="Özelleştir"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>
    )
  }

  return (
    <div className="absolute right-3 md:right-4 bottom-4 w-72 md:w-80 bg-[#111618]/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[60vh] shadow-2xl animate-fade-in-up">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-medium text-sm">Özelleştir</h2>
            <p className="text-white/40 text-[10px]">{visibleGroups.length} varyant grubu</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShareLink}
            className="size-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Linki Kopyala"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          {onToggle && (
            <button
              onClick={onToggle}
              className="size-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {visibleGroups.map(group => {
          const isExpanded = expandedGroups.has(group.id)
          const selectedOption = group.selectedOptionIndex !== null && group.selectedOptionIndex !== undefined 
            ? group.options[group.selectedOptionIndex] 
            : null
          const isHighlighted = highlightedGroup === group.id
          
          return (
            <div 
              key={group.id}
              className={`bg-white/5 rounded-xl overflow-hidden transition-all ${
                isHighlighted ? 'ring-2 ring-primary animate-pulse' : ''
              }`}
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full p-3 flex items-center justify-between text-left transition-colors ${
                  isHighlighted ? 'bg-primary/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Preview of selected option */}
                  {selectedOption?.type === 'color' && (
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-white/20 shadow-inner"
                      style={{ backgroundColor: selectedOption.value }}
                    />
                  )}
                  {selectedOption?.type === 'texture' && (
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                      {selectedOption.textureUrl ? (
                        <img src={selectedOption.textureUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs">🖼️</span>
                      )}
                    </div>
                  )}
                  {!selectedOption && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center">
                      {/* 3D Mesh Icon */}
                      <svg className="w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                        <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="3.27,6.96 12,12.01 20.73,6.96" />
                        <line strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate" title={group.targetMeshNames.join(', ')}>
                      {group.displayName}
                    </div>
                    <div className="text-white/40 text-xs truncate" title={group.targetMeshNames.join(', ')}>
                      <span className="text-white/30">mesh:</span> {group.targetMeshNames.length > 1 ? `${group.targetMeshNames.length} mesh` : group.targetMeshNames[0]} • {selectedOption?.name || 'Seçilmedi'}
                    </div>
                  </div>
                </div>
                
                <svg 
                  className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Options Grid */}
              {isExpanded && group.options.length > 0 && (
                <div className="px-3 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((option, index) => {
const isSelected = group.selectedOptionIndex === index
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleSelectOption(group.id, index)}
                          className={`group relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected 
                              ? 'border-primary shadow-lg shadow-primary/30 scale-105' 
                              : 'border-white/10 hover:border-white/30 hover:scale-105'
                          }`}
                          title={option.name}
                        >
                          {/* Option Preview */}
                          {option.type === 'color' && (
                            <div 
                              className="w-full h-full"
                              style={{ backgroundColor: option.value }}
                            />
                          )}
                          {option.type === 'texture' && option.textureUrl && (
                            <img 
                              src={option.textureUrl} 
                              alt={option.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Selected Check */}
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Tooltip */}
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {option.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <p className="text-white/30 text-[10px] text-center">
          Seçimleriniz URL'de saklanır • Paylaşmak için 🔗 kullanın
        </p>
      </div>
    </div>
  )
}
