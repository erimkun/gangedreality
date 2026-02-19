import { useState } from 'react'
import { PopupBlock, PopupBlockType } from '../../../types'

interface BlockEditorProps {
    blocks: PopupBlock[]
    onChange: (blocks: PopupBlock[]) => void
}

const generateId = () => `b_${Math.random().toString(36).substr(2, 9)}`

export default function BlockEditor({ blocks, onChange }: BlockEditorProps) {
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

    const addBlock = (type: PopupBlockType) => {
        const newBlock: PopupBlock = {
            id: generateId(),
            type,
            settings: {},
            content: ''
        }

        // Default settings per type
        if (type === 'text') {
            newBlock.content = 'Yeni metin bloğu'
            newBlock.settings = { fontSize: 14, color: '#ffffff', textAlign: 'left' }
        } else if (type === 'image') {
            newBlock.settings = { height: 160, objectFit: 'cover' }
        } else if (type === 'list') {
            newBlock.settings = { items: ['Liste maddesi 1', 'Liste maddesi 2'], listStyle: 'bullet' }
        } else if (type === 'divider') {
            newBlock.settings = { thickness: 1, dividerColor: 'rgba(255,255,255,0.2)', margin: 16 }
        } else if (type === 'icon') {
            newBlock.settings = { icon: '<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>', iconSize: 32, iconColor: '#fbbf24', textAlign: 'center' }
        }

        onChange([...blocks, newBlock])
        setActiveBlockId(newBlock.id)
    }

    const updateBlock = (id: string, updates: Partial<PopupBlock>) => {
        onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b))
    }

    const updateSettings = (id: string, settingsUpdates: any) => {
        onChange(blocks.map(b => b.id === id ? { ...b, settings: { ...b.settings, ...settingsUpdates } } : b))
    }

    const removeBlock = (id: string) => {
        onChange(blocks.filter(b => b.id !== id))
        if (activeBlockId === id) setActiveBlockId(null)
    }

    const moveBlock = (id: string, direction: -1 | 1) => {
        const index = blocks.findIndex(b => b.id === id)
        if (index < 0) return
        if (direction === -1 && index === 0) return
        if (direction === 1 && index === blocks.length - 1) return

        const newBlocks = [...blocks]
        const temp = newBlocks[index]
        newBlocks[index] = newBlocks[index + direction]
        newBlocks[index + direction] = temp
        onChange(newBlocks)
    }

    const handleImageUpload = (id: string, file: File) => {
        // Revoke old blob URL if exists
        const oldBlock = blocks.find(b => b.id === id)
        if (oldBlock?.content && oldBlock.content.startsWith('blob:')) {
            URL.revokeObjectURL(oldBlock.content)
        }

        const url = URL.createObjectURL(file)
        
        // Store file reference globally for export
        if (!window.__interactionFiles) {
            window.__interactionFiles = new Map()
        }
        window.__interactionFiles.set(url, file)
        
        updateBlock(id, { content: url })
    }

    return (
        <div className="space-y-4">
            {/* Block List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {blocks.map((block, index) => (
                    <div
                        key={block.id}
                        className={`bg-editor-panel border border-editor-border rounded-lg overflow-hidden transition-all ${activeBlockId === block.id ? 'ring-1 ring-primary border-primary' : ''
                            }`}
                    >
                        {/* Block Header */}
                        <div
                            className="px-3 py-2 bg-editor-bg flex items-center justify-between cursor-pointer hover:bg-white/5"
                            onClick={() => setActiveBlockId(activeBlockId === block.id ? null : block.id)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase text-primary/80 w-12">{block.type}</span>
                                <span className="text-xs text-white/60 truncate max-w-[150px]">
                                    {block.type === 'text' ? block.content : `${block.type} settings`}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1) }} className="p-1 hover:text-white text-gray-500 disabled:opacity-20" disabled={index === 0}>↑</button>
                                <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1) }} className="p-1 hover:text-white text-gray-500 disabled:opacity-20" disabled={index === blocks.length - 1}>↓</button>
                                <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }} className="p-1 hover:text-red-400 text-gray-500">×</button>
                            </div>
                        </div>

                        {/* Block Settings (Expanded) */}
                        {activeBlockId === block.id && (
                            <div className="p-3 bg-editor-panel space-y-3 border-t border-editor-border animate-fade-in">

                                {/* --- TEXT EDITOR --- */}
                                {block.type === 'text' && (
                                    <>
                                        <textarea
                                            value={block.content}
                                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                            className="w-full bg-editor-bg border border-editor-border rounded p-2 text-sm text-white resize-y min-h-[80px]"
                                        />
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Boyut</label>
                                                <input
                                                    type="number"
                                                    value={block.settings.fontSize || 14}
                                                    onChange={(e) => updateSettings(block.id, { fontSize: parseInt(e.target.value) })}
                                                    className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Renk</label>
                                                <input
                                                    type="color"
                                                    value={block.settings.color || '#ffffff'}
                                                    onChange={(e) => updateSettings(block.id, { color: e.target.value })}
                                                    className="w-full h-7 bg-transparent cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Hizalama</label>
                                                <select
                                                    value={block.settings.textAlign || 'left'}
                                                    onChange={(e) => updateSettings(block.id, { textAlign: e.target.value })}
                                                    className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="left">Sol</option>
                                                    <option value="center">Orta</option>
                                                    <option value="right">Sağ</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- IMAGE EDITOR --- */}
                                {block.type === 'image' && (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(block.id, e.target.files[0])}
                                            className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                                        />
                                        {block.content && (
                                            <div className="relative h-20 bg-black/40 rounded overflow-hidden">
                                                <img src={block.content} className="h-full w-full object-contain" />
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Yükseklik (px)</label>
                                                <input
                                                    type="number"
                                                    value={block.settings.height || 160}
                                                    onChange={(e) => updateSettings(block.id, { height: parseInt(e.target.value) })}
                                                    className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Sığdırma</label>
                                                <select
                                                    value={block.settings.objectFit || 'cover'}
                                                    onChange={(e) => updateSettings(block.id, { objectFit: e.target.value })}
                                                    className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="cover">Kırp (Cover)</option>
                                                    <option value="contain">Sığdır (Contain)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- LIST EDITOR --- */}
                                {block.type === 'list' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-400 block">Maddeler (Her satır bir madde)</label>
                                            <textarea
                                                value={(block.settings.items || []).join('\n')}
                                                onChange={(e) => updateSettings(block.id, { items: e.target.value.split('\n') })}
                                                className="w-full bg-editor-bg border border-editor-border rounded p-2 text-sm text-white resize-y min-h-[80px]"
                                                placeholder="Madde 1&#10;Madde 2&#10;Madde 3"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Stil</label>
                                                <select
                                                    value={block.settings.listStyle || 'bullet'}
                                                    onChange={(e) => updateSettings(block.id, { listStyle: e.target.value })}
                                                    className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="bullet">Nokta (.)</option>
                                                    <option value="number">Numara (1.)</option>
                                                    <option value="icon">SVG İkon</option>
                                                </select>
                                            </div>
                                            {block.settings.listStyle === 'icon' && (
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-gray-400 block mb-1">İkon (SVG String)</label>
                                                    <input
                                                        type="text"
                                                        value={block.settings.icon || ''}
                                                        onChange={(e) => updateSettings(block.id, { icon: e.target.value })}
                                                        className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                                        placeholder="<svg>...</svg>"
                                                    />
                                                </div>
                                            )}
                                            <div className="max-w-[40px]">
                                                <label className="text-[10px] text-gray-400 block mb-1">Renk</label>
                                                <input
                                                    type="color"
                                                    value={block.settings.iconColor || '#ffffff'}
                                                    onChange={(e) => updateSettings(block.id, { iconColor: e.target.value })}
                                                    className="w-full h-7 bg-transparent cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- DIVIDER EDITOR --- */}
                                {block.type === 'divider' && (
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 block mb-1">Kalınlık</label>
                                            <input
                                                type="number"
                                                value={block.settings.thickness || 1}
                                                onChange={(e) => updateSettings(block.id, { thickness: parseInt(e.target.value) })}
                                                className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 block mb-1">Boşluk (Margin)</label>
                                            <input
                                                type="number"
                                                value={block.settings.margin || 16}
                                                onChange={(e) => updateSettings(block.id, { margin: parseInt(e.target.value) })}
                                                className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 block mb-1">Renk</label>
                                            <input
                                                type="color"
                                                value={block.settings.dividerColor || '#ffffff'}
                                                onChange={(e) => updateSettings(block.id, { dividerColor: e.target.value })}
                                                className="w-full h-7 bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}
                                {/* --- ICON EDITOR --- */}
                                {block.type === 'icon' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-400 block">SVG İkon Kodu</label>
                                            <textarea
                                                value={block.settings.icon || ''}
                                                onChange={(e) => updateSettings(block.id, { icon: e.target.value })}
                                                className="w-full bg-editor-bg border border-editor-border rounded p-2 text-xs text-gray-300 font-mono h-20"
                                                placeholder="<svg>...</svg>"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Boyut (px)</label>
                                                <input
                                                    type="number"
                                                    value={block.settings.iconSize || 32}
                                                    onChange={(e) => updateSettings(block.id, { iconSize: parseInt(e.target.value) })}
                                                    className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Renk</label>
                                                <input
                                                    type="color"
                                                    value={block.settings.iconColor || '#ffffff'}
                                                    onChange={(e) => updateSettings(block.id, { iconColor: e.target.value })}
                                                    className="w-full h-7 bg-transparent cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 block mb-1">Hizalama</label>
                                                <select
                                                    value={block.settings.textAlign || 'center'}
                                                    onChange={(e) => updateSettings(block.id, { textAlign: e.target.value })}
                                                    className="w-full bg-editor-bg border border-editor-border rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="left">Sol</option>
                                                    <option value="center">Orta</option>
                                                    <option value="right">Sağ</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Block Buttons */}
            <div className="grid grid-cols-5 gap-1">
                <button onClick={() => addBlock('text')} className="flex flex-col items-center gap-1 p-2 bg-editor-panel hover:bg-white/10 rounded transition-colors text-[10px] text-gray-400 hover:text-white">
                    <span className="text-sm">📝</span> Metin
                </button>
                <button onClick={() => addBlock('image')} className="flex flex-col items-center gap-1 p-2 bg-editor-panel hover:bg-white/10 rounded transition-colors text-[10px] text-gray-400 hover:text-white">
                    <span className="text-sm">🖼️</span> Resim
                </button>
                <button onClick={() => addBlock('list')} className="flex flex-col items-center gap-1 p-2 bg-editor-panel hover:bg-white/10 rounded transition-colors text-[10px] text-gray-400 hover:text-white">
                    <span className="text-sm">📋</span> Liste
                </button>
                <button onClick={() => addBlock('divider')} className="flex flex-col items-center gap-1 p-2 bg-editor-panel hover:bg-white/10 rounded transition-colors text-[10px] text-gray-400 hover:text-white">
                    <span className="text-sm">➖</span> Çizgi
                </button>
                <button onClick={() => addBlock('icon')} className="flex flex-col items-center gap-1 p-2 bg-editor-panel hover:bg-white/10 rounded transition-colors text-[10px] text-gray-400 hover:text-white">
                    <span className="text-sm">⭐</span> İkon
                </button>
            </div>
        </div>
    )
}
