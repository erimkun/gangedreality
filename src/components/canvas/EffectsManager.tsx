import { EffectComposer, N8AO, Bloom, Vignette, BrightnessContrast, HueSaturation, TiltShift2 } from '@react-three/postprocessing'
import { useSceneStore } from '../../store/useSceneStore'
import { useNavigationStore } from '../../store/useNavigationStore'

export default function EffectsManager() {
    const { effects } = useSceneStore()
    const isNavigating = useNavigationStore(state => state.isNavigating)

    // If no effects config exists yet, don't render anything
    if (!effects) return null

    const { ao, bloom, vignette, colorGrading } = effects

    // Only render if at least one effect is enabled or configured (or if navigating for motion blur)
    // We check individual flags. If nothing is enabled, we return null to save performance.
    const isAnyEffectEnabled = ao?.enabled || bloom?.enabled || vignette?.enabled || colorGrading?.enabled || isNavigating
    if (!isAnyEffectEnabled) return null

    return (
        <EffectComposer multisampling={0}>
            <>
                {ao?.enabled && (
                    <N8AO
                        aoRadius={ao.radius}
                        distanceFalloff={ao.distanceFalloff}
                        intensity={ao.intensity}
                        color={ao.color}
                        screenSpaceRadius={false}
                        halfRes={false}
                        quality={ao.quality}
                    />
                )}

                {bloom?.enabled && (
                    <Bloom
                        intensity={bloom.intensity}
                        luminanceThreshold={bloom.luminanceThreshold}
                        luminanceSmoothing={bloom.luminanceSmoothing}
                        mipmapBlur
                    />
                )}

                {vignette?.enabled && (
                    <Vignette
                        offset={vignette.offset}
                        darkness={vignette.darkness}
                    />
                )}

                {colorGrading?.enabled && (
                    <>
                        <BrightnessContrast
                            brightness={colorGrading.brightness}
                            contrast={colorGrading.contrast}
                        />
                        <HueSaturation
                            saturation={colorGrading.saturation}
                            hue={colorGrading.hue / 180 * Math.PI}
                        />
                    </>
                )}

                {/* Navigation Motion Blur - Noktadan noktaya giderken radial blur efekti */}
                {isNavigating && (
                    <TiltShift2
                        blur={0.15}       // Blur yoğunluğu (0-1 arası, yüksek = daha bulanık)
                        taper={0.5}       // Blur'un kenardan merkeze azalma oranı (0 = sabit blur, 1 = tamamen azalan)
                        start={[0.5, 0.0]} // Blur başlangıç noktası [x, y] (0-1 normalize, ekranın üstü)
                        end={[0.5, 1.0]}   // Blur bitiş noktası [x, y] (0-1 normalize, ekranın altı)
                        samples={6}       // Örnek sayısı (yüksek = daha kaliteli ama daha yavaş)
                    />
                )}
            </>
        </EffectComposer>
    )
}
