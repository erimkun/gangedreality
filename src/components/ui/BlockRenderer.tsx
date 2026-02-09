import { PopupBlock } from '../../types'

interface BlockRendererProps {
    blocks: PopupBlock[]
    className?: string
}

const SVG_ALLOWED_TAGS = new Set([
    'svg',
    'g',
    'path',
    'circle',
    'rect',
    'line',
    'polyline',
    'polygon'
])

const SVG_ALLOWED_ATTRS = new Set([
    'width',
    'height',
    'viewbox',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'd',
    'points',
    'cx',
    'cy',
    'r',
    'x',
    'y',
    'rx',
    'ry',
    'transform',
    'opacity',
    'fill-rule',
    'clip-rule',
    'stroke-miterlimit',
    'stroke-dasharray',
    'stroke-dashoffset',
    'stroke-opacity',
    'fill-opacity',
    'xmlns'
])

const isProbablySvgMarkup = (value: string) => /<svg[\s>]/i.test(value)

const sanitizeSvgMarkup = (value: string) => {
    if (typeof window === 'undefined') return null
    if (!isProbablySvgMarkup(value)) return null

    const parser = new DOMParser()
    const doc = parser.parseFromString(value, 'image/svg+xml')
    if (doc.getElementsByTagName('parsererror').length > 0) return null

    const svg = doc.documentElement
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return null

    const sanitizeElement = (element: Element) => {
        const children = Array.from(element.children)
        for (const child of children) {
            const tagName = child.tagName.toLowerCase()
            if (!SVG_ALLOWED_TAGS.has(tagName)) {
                child.remove()
                continue
            }
            sanitizeElement(child)
        }

        for (const attr of Array.from(element.attributes)) {
            const name = attr.name.toLowerCase()
            if (name.startsWith('on') || !SVG_ALLOWED_ATTRS.has(name)) {
                element.removeAttribute(attr.name)
                continue
            }
            if ((name === 'href' || name === 'xlink:href') && /javascript:/i.test(attr.value)) {
                element.removeAttribute(attr.name)
            }
        }
    }

    sanitizeElement(svg)

    return new XMLSerializer().serializeToString(svg)
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
                                            (() => {
                                                const safeSvg = sanitizeSvgMarkup(block.settings.icon)
                                                return safeSvg ? (
                                                    <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: safeSvg }} />
                                                ) : (
                                                    <span className="text-sm">{block.settings.icon}</span>
                                                )
                                            })()
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
                            {(() => {
                                const safeSvg = sanitizeSvgMarkup(block.settings.icon)
                                return safeSvg ? (
                                    <div
                                        style={{ fontSize: block.settings.iconSize || 24, display: 'inline-block' }}
                                        aria-hidden="true"
                                        dangerouslySetInnerHTML={{ __html: safeSvg }}
                                    />
                                ) : (
                                    <span style={{ fontSize: block.settings.iconSize || 24, display: 'inline-block' }}>
                                        {block.settings.icon}
                                    </span>
                                )
                            })()}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
