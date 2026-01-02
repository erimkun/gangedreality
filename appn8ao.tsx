import { Canvas } from "@react-three/fiber"
import { Sky, Center, Gltf, OrbitControls, BakeShadows } from "@react-three/drei"
import { EffectComposer, N8AO, TiltShift2 } from "@react-three/postprocessing"

/*
{
  "name": "n8ao",
  "version": "1.0.0",
  "description": "",
  "keywords": [],
  "main": "src/index.js",
  "dependencies": {
    "@react-three/cannon": "6.5.2",
    "@react-three/drei": "9.72.1",
    "@react-three/fiber": "8.13.0",
    "@react-three/postprocessing": "2.14.9",
    "@types/three": "0.152.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-scripts": "5.0.1",
    "three": "0.152.2"
  },
  "devDependencies": {
    "typescript": "3.8.3"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject"
  },
  "browserslist": ">1%, not dead, not ie <= 11, not op_mini all"
}
*/

export const App = () => (
  <Canvas orthographic shadows gl={{ antialias: false }} camera={{ position: [100, 50, -100], zoom: 40, near: 100, far: 220 }}>
    <hemisphereLight intensity={0.5} color="white" groundColor="#f88" />
    <directionalLight color="orange" intensity={2} angle={0.3} penumbra={1} position={[30, 20, 30]} castShadow shadow-mapSize={1024} shadow-bias={-0.0004}>
      <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40, 1, 1000]} />
    </directionalLight>
    <Center position={[0, 2, 0]}>
      <Gltf castShadow receiveShadow scale={0.1} src="/city-gt.glb" />
    </Center>
    <EffectComposer disableNormalPass multisampling={8}>
      <N8AO aoRadius={50} distanceFalloff={0.2} intensity={11} screenSpaceRadius halfRes />
      <TiltShift2 />
    </EffectComposer>
    <OrbitControls zoomSpeed={0.75} minZoom={20} maxZoom={200} />
    <BakeShadows />
    <Sky />
  </Canvas>
)
