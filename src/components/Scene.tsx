import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, SoftShadows } from '@react-three/drei'
import { Suspense, useState, useCallback } from 'react'
import { Configurator } from './Configurator.tsx'
import { ColorControls } from './ColorControls.tsx'
import type { Colors } from './Configurator'

// Loading fallback component
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666666" />
    </mesh>
  )
}

// Enable better shadows
function Shadows() {
  return <SoftShadows size={25} samples={20} focus={0.5} />
}

export function Scene() {
  const [colors, setColors] = useState<Colors>({
    BACK_PLATE: '#ffffff',
    BUTTONS: '#303030',
    FRONT_PLATE: '#ffffff'
  })

  const handleColorChange = useCallback((newColors: Colors) => {
    setColors(newColors)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0.2, 2], fov: 45 }}
        gl={{
          antialias: true,
          alpha: false,
          depth: true,
          preserveDrawingBuffer: true
        }}>        <Suspense fallback={<LoadingFallback />}>
          <Shadows />
          <Environment preset="studio" />
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={2048}
          />
          <directionalLight
            position={[-5, 5, -5]}
            intensity={0.5}
            castShadow
          />
          <Configurator colors={colors} />
          <OrbitControls
            autoRotate={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={1.5}
            maxDistance={4}
          />
        </Suspense>
      </Canvas>
      <ColorControls onChange={handleColorChange} />
    </div>
  )
}
