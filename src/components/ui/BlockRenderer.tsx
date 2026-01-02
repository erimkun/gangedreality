import { PopupBlock } from '../../types'

interface BlockRendererProps {
    blocks: PopupBlock[]
    className?: string
}

export default function BlockRenderer({ blocks, className = '' }: BlockRendererProps) {
    if (!blocks || blocks.length === 0) return null

    return (
        <div className={`space-y-4 ${className}`}>
            {blocks.map((block) => (
                <div key={block.id} className="block-item">
                    {/* --- TEXT BLOCK --- */}
                    {block.type === 'text' && (
                        <div
                            style={{
                                fontSize: block.settings.fontSize || 14,
                                color: block.settings.color || 'inherit',
                                textAlign: block.settings.textAlign || 'left',
                                lineHeight: 1.5
                            }}
                        >
                            {block.content}
                        </div>
                    )}

                    {/* --- IMAGE BLOCK --- */}
                    {block.type === 'image' && block.content && (
                        <div
                            className="relative overflow-hidden rounded-lg"
                            style={{ height: block.settings.height || 200 }}
                        >
                            <img
                                src={block.content}
                                alt="Popup content"
                                className="w-full h-full"
                                style={{ objectFit: block.settings.objectFit || 'cover' }}
                            />
                        </div>
                    )}

                    {/* --- LIST BLOCK --- */}
                    {block.type === 'list' && block.settings.items && (
                        <ul className="space-y-2">
                            {block.settings.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    {/* Icon/Bullet rendering */}
                                    <div className="mt-1 shrink-0" style={{ color: block.settings.iconColor || 'inherit' }}>
                                        {block.settings.listStyle === 'icon' && block.settings.icon ? (
                                            // If SVG content is provided directly (advanced) or just a keyword
                                            // For now assuming simple text emoji or handling custom SVG later if needed
                                            <span dangerouslySetInnerHTML={{ __html: block.settings.icon }} />
                                        ) : block.settings.listStyle === 'number' ? (
                                            <span className="font-bold opacity-80">{i + 1}.</span>
                                        ) : (
                                            // Default bullet
                                            <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5" />
                                        )}
                                    </div>
                                    <span className="text-sm opacity-90">{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* --- DIVIDER BLOCK --- */}
                    {block.type === 'divider' && (
                        <hr
                            style={{
                                borderTopWidth: block.settings.thickness || 1,
                                borderColor: block.settings.dividerColor || 'rgba(255,255,255,0.1)',
                                marginTop: block.settings.margin || 16,
                                marginBottom: block.settings.margin || 16
                            }}
                        />
                    )}

                    {/* --- ICON BLOCK --- */}
                    {block.type === 'icon' && block.settings.icon && (
                        <div
                            style={{
                                textAlign: block.settings.textAlign || 'center',
                                color: block.settings.iconColor || 'inherit'
                            }}
                        >
                            <div
                                style={{ fontSize: block.settings.iconSize || 24, display: 'inline-block' }}
                                dangerouslySetInnerHTML={{ __html: block.settings.icon }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
