import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'

interface HdriSphereProps {
    url: string
    position: [number, number, number]
    scale: number
    rotation: number
}

function HdriSphere({ url, position, scale, rotation }: HdriSphereProps) {
    const meshRef = useRef<THREE.Mesh>(null)
    const [texture, setTexture] = useState<THREE.Texture | null>(null)

    // Determine loader based on extension (only .hdr supported)
    const isHdr = url.toLowerCase().endsWith('.hdr')

    // Load texture manually instead of useLoader to avoid shared-cache mutation issues
    useEffect(() => {
        let disposed = false
        let loadedTexRef: THREE.Texture | null = null

        // Clear previous texture while loading new one
        setTexture(prev => {
            if (prev) prev.dispose()
            return null
        })

        const onLoad = (loadedTex: THREE.Texture) => {
            if (disposed) {
                loadedTex.dispose()
                return
            }
            // Clone so we never mutate a cached/shared texture
            const cloned = loadedTex.clone()
            cloned.needsUpdate = true
            // Copy image data which .clone() doesn't deep-copy 
            cloned.image = loadedTex.image
            cloned.source = loadedTex.source

            cloned.mapping = THREE.EquirectangularReflectionMapping

            if (!isHdr) {
                try { cloned.colorSpace = THREE.SRGBColorSpace } catch { /* read-only in some DataTexture variants */ }
            }

            loadedTexRef = cloned
            setTexture(cloned)
        }

        const onError = (err: unknown) => {
            console.error('[HdriSphere] Failed to load texture:', err)
        }

        if (isHdr) {
            new RGBELoader().load(url, onLoad, undefined, onError)
        } else {
            new THREE.TextureLoader().load(url, onLoad, undefined, onError)
        }

        return () => {
            disposed = true
            if (loadedTexRef) {
                loadedTexRef.dispose()
                loadedTexRef = null
            }
        }
    }, [url, isHdr])

    if (!texture) return null

    return (
        <group position={position} rotation={[0, rotation || 0, 0]} scale={[scale, scale, scale]}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshBasicMaterial
                    map={texture}
                    side={THREE.BackSide}
                    toneMapped={false}
                />
            </mesh>
        </group>
    )
}

export default HdriSphere
