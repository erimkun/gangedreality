import { useSceneStore } from '../../../store/useSceneStore'
import { defaultEffectsConfig } from '../../../types'

export default function EffectsPanel() {
    const { effects, updateEffects } = useSceneStore()

    // Safe defaults if undefined
    const ao = effects?.ao || defaultEffectsConfig.ao!
    const bloom = effects?.bloom || defaultEffectsConfig.bloom!
    const vignette = effects?.vignette || defaultEffectsConfig.vignette!

    // --- Ambient Occlusion Handlers ---
    const handleToggleAO = (enabled: boolean) => {
        updateEffects((prev) => ({
            ao: { ...(prev.ao || defaultEffectsConfig.ao!), enabled }
        }))
    }

    const updateAO = (key: string, value: any) => {
        updateEffects((prev) => ({
            ao: { ...(prev.ao || defaultEffectsConfig.ao!), [key]: value }
        }))
    }

    // --- Bloom Handlers ---
    const handleToggleBloom = (enabled: boolean) => {
        updateEffects((prev) => ({
            bloom: { ...(prev.bloom || defaultEffectsConfig.bloom!), enabled }
        }))
    }

    const updateBloom = (key: string, value: any) => {
        updateEffects((prev) => ({
            bloom: { ...(prev.bloom || defaultEffectsConfig.bloom!), [key]: value }
        }))
    }

    // --- Vignette Handlers ---
    const handleToggleVignette = (enabled: boolean) => {
        updateEffects((prev) => ({
            vignette: { ...(prev.vignette || defaultEffectsConfig.vignette!), enabled }
        }))
    }

    const updateVignette = (key: string, value: any) => {
        updateEffects((prev) => ({
            vignette: { ...(prev.vignette || defaultEffectsConfig.vignette!), [key]: value }
        }))
    }

    // --- Color Grading Handlers ---
    const colorGrading = effects?.colorGrading || defaultEffectsConfig.colorGrading!

    const handleToggleColorGrading = (enabled: boolean) => {
        updateEffects((prev) => ({
            colorGrading: { ...(prev.colorGrading || defaultEffectsConfig.colorGrading!), enabled }
        }))
    }

    const updateColorGrading = (key: string, value: any) => {
        updateEffects((prev) => ({
            colorGrading: { ...(prev.colorGrading || defaultEffectsConfig.colorGrading!), [key]: value }
        }))
    }

    return (
        <div className="space-y-6 text-white/80 p-4">
            {/* 1. Ambient Occlusion Section */}
            <div className="space-y-4 border-b border-white/10 pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-medium text-white">Ambient Occlusion</span>
                        <div className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60">Gölge</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={ao.enabled}
                            onChange={(e) => handleToggleAO(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {ao.enabled && (
                    <div className="space-y-4 animate-fade-in pl-2 border-l-2 border-white/5">
                        {/* Intensity */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Yoğunluk</span>
                                <span className="text-white/60">{ao.intensity?.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={ao.intensity}
                                onChange={(e) => updateAO('intensity', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Radius */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Yarıçap (Radius)</span>
                                <span className="text-white/60">{ao.radius?.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.1"
                                value={ao.radius}
                                onChange={(e) => updateAO('radius', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Distance Falloff */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Mesafe (Falloff)</span>
                                <span className="text-white/60">{ao.distanceFalloff?.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={ao.distanceFalloff}
                                onChange={(e) => updateAO('distanceFalloff', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Gölge Rengi</span>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full border border-white/20"
                                        style={{ backgroundColor: ao.color }}
                                    />
                                    <span className="text-white/60 uppercase">{ao.color}</span>
                                </div>
                            </div>
                            <input
                                type="color"
                                value={ao.color}
                                onChange={(e) => updateAO('color', e.target.value)}
                                className="w-full h-8 bg-transparent cursor-pointer rounded overflow-hidden"
                            />
                        </div>

                        {/* Quality */}
                        <div className="space-y-2">
                            <span className="text-xs block mb-1">Kalite</span>
                            <div className="grid grid-cols-3 gap-1">
                                {['low', 'medium', 'high'].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => updateAO('quality', q)}
                                        className={`px-2 py-1 text-[10px] rounded border transition-colors ${ao.quality === q
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {q.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Bloom Section */}
            <div className="space-y-4 border-b border-white/10 pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-medium text-white">Bloom</span>
                        <div className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60">Işıma</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={bloom.enabled}
                            onChange={(e) => handleToggleBloom(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {bloom.enabled && (
                    <div className="space-y-4 animate-fade-in pl-2 border-l-2 border-white/5">
                        {/* Intensity */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Yoğunluk</span>
                                <span className="text-white/60">{bloom.intensity?.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="3"
                                step="0.05"
                                value={bloom.intensity}
                                onChange={(e) => updateBloom('intensity', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Threshold */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Eşik (Threshold)</span>
                                <span className="text-white/60">{bloom.luminanceThreshold?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={bloom.luminanceThreshold}
                                onChange={(e) => updateBloom('luminanceThreshold', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-[10px] text-white/40">Sadece bu değerden parlak yerler ışıldar.</p>
                        </div>

                        {/* Smoothing */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Yumuşatma (Smoothing)</span>
                                <span className="text-white/60">{bloom.luminanceSmoothing?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={bloom.luminanceSmoothing}
                                onChange={(e) => updateBloom('luminanceSmoothing', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Vignette Section */}
            <div className="space-y-4 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-medium text-white">Vignette</span>
                        <div className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60">Köşe Karartma</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={vignette.enabled}
                            onChange={(e) => handleToggleVignette(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {vignette.enabled && (
                    <div className="space-y-4 animate-fade-in pl-2 border-l-2 border-white/5">
                        {/* Offset */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Yayılma (Offset)</span>
                                <span className="text-white/60">{vignette.offset?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={vignette.offset}
                                onChange={(e) => updateVignette('offset', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Darkness */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Koyuluk (Darkness)</span>
                                <span className="text-white/60">{vignette.darkness?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={vignette.darkness}
                                onChange={(e) => updateVignette('darkness', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                )}
            </div>
            {/* 4. Color Grading Section */}
            <div className="space-y-4 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-medium text-white">Renk Düzenleme (Color Grading)</span>
                        <div className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60">Atmosfer</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={colorGrading?.enabled || false}
                            onChange={(e) => handleToggleColorGrading(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {colorGrading?.enabled && (
                    <div className="space-y-4 animate-fade-in pl-2 border-l-2 border-white/5">
                        {/* Brightness */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Parlaklık (Brightness)</span>
                                <span className="text-white/60">{colorGrading.brightness?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="-0.5"
                                max="0.5"
                                step="0.01"
                                value={colorGrading.brightness}
                                onChange={(e) => updateColorGrading('brightness', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Contrast */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Kontrast (Contrast)</span>
                                <span className="text-white/60">{colorGrading.contrast?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="-0.5"
                                max="0.5"
                                step="0.01"
                                value={colorGrading.contrast}
                                onChange={(e) => updateColorGrading('contrast', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Saturation */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Doygunluk (Saturation)</span>
                                <span className="text-white/60">{colorGrading.saturation?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.05"
                                value={colorGrading.saturation}
                                onChange={(e) => updateColorGrading('saturation', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Hue */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Renk Tonu (Hue)</span>
                                <span className="text-white/60">{colorGrading.hue?.toFixed(0)}°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                step="1"
                                value={colorGrading.hue}
                                onChange={(e) => updateColorGrading('hue', parseFloat(e.target.value))}
                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
