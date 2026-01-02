import { EffectComposer, N8AO, Bloom, Vignette, BrightnessContrast, HueSaturation } from '@react-three/postprocessing'
import { useSceneStore } from '../../store/useSceneStore'

export default function EffectsManager() {
    const { effects } = useSceneStore()

    // If no effects config exists yet, don't render anything
    if (!effects) return null

    const { ao, bloom, vignette, colorGrading } = effects

    // Only render if at least one effect is enabled or configured
    // We check individual flags. If nothing is enabled, we return null to save performance.
    const isAnyEffectEnabled = ao?.enabled || bloom?.enabled || vignette?.enabled || colorGrading?.enabled
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
            </>
        </EffectComposer>
    )
}
