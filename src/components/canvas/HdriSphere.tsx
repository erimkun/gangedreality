import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { RGBELoader } from 'three-stdlib'

interface HdriSphereProps {
    url: string
    position: [number, number, number]
    scale: number
    rotation: number
}

function HdriSphere({ url, position, scale, rotation }: HdriSphereProps) {
    const meshRef = useRef<THREE.Mesh>(null)

    // Determine loader based on extension (simple check)
    const isHdr = url.toLowerCase().includes('.hdr') || url.toLowerCase().includes('.exr')
    const loader = isHdr ? RGBELoader : THREE.TextureLoader

    // Load texture
    const texture = useLoader(loader as any, url) as THREE.Texture

    useMemo(() => {
        if (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping
            // If using TextureLoader for standard images, we might want sRGB encoding
            if (!isHdr) {
                texture.colorSpace = THREE.SRGBColorSpace
            }
        }
    }, [texture, isHdr])

    return (
        <group position={position} rotation={[0, rotation || 0, 0]} scale={[scale, scale, scale]}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshBasicMaterial
                    map={texture}
                    side={THREE.BackSide}
                    toneMapped={false} // HDRIs usually shouldn't be tone mapped twice if Environment handles it, but here we render raw
                />
            </mesh>
        </group>
    )
}

export default HdriSphere
