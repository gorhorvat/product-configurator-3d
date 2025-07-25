import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, SoftShadows } from '@react-three/drei'
import { Suspense, useCallback, useState } from 'react'
import { Configurator } from './Configurator.tsx'
import { ColorControls, type DynamicColors } from './ColorControls.tsx'
import { ModelSelector, MODEL_PRESETS } from './ModelSelector.tsx'
import { ExplodeControls } from './ExplodeControls.tsx'
import { Toolbar } from './Toolbar.tsx'

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
  // Always use the PS5 controller (the only model available)
  const currentModel = MODEL_PRESETS[0]
  
  // Initialize colors state with proper default values
  const [colors, setColors] = useState<DynamicColors>(() => {
    const initialColors: DynamicColors = {}
    currentModel.materials.forEach(material => {
      initialColors[material.id] = material.defaultColor
    })
    return initialColors  })
  const [explodeAmount, setExplodeAmount] = useState(0)
  const [explodeViewEnabled, setExplodeViewEnabled] = useState(false)
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(true)
  const handleColorChange = useCallback((newColors: DynamicColors) => {
    setColors(newColors)
  }, [])

  const handleExplodeChange = useCallback((newExplodeAmount: number) => {
    setExplodeAmount(newExplodeAmount)
  }, [])
  const handleExplodeViewToggle = useCallback((enabled: boolean) => {
    setExplodeViewEnabled(enabled)
    // Reset explode amount when disabling explode view
    if (!enabled) {
      setExplodeAmount(0)
    }
  }, [])
  const handleResetColors = useCallback(() => {
    const defaultColors: DynamicColors = {}
    currentModel.materials.forEach(material => {
      defaultColors[material.id] = material.defaultColor
    })
    setColors(defaultColors)
  }, [currentModel.materials])

  const handleAutoRotateToggle = useCallback((enabled: boolean) => {
    setAutoRotateEnabled(enabled)
  }, [])
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>      <Toolbar 
        explodeViewEnabled={explodeViewEnabled}
        onExplodeViewToggle={handleExplodeViewToggle}
        autoRotateEnabled={autoRotateEnabled}
        onAutoRotateToggle={handleAutoRotateToggle}
        onResetColors={handleResetColors}
      />
      <Canvas
        shadows
        camera={{ position: [0, 0.2, 2], fov: 45 }}
        gl={{
          antialias: true,
          alpha: false,
          depth: true,
          preserveDrawingBuffer: true
        }}>
        <Suspense fallback={<LoadingFallback />}>
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
          <Configurator colors={colors} modelPreset={currentModel} explodeAmount={explodeAmount} />          <OrbitControls
            autoRotate={autoRotateEnabled}
            autoRotateSpeed={1.0}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.2}
            minDistance={1.0}
            maxDistance={6}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Suspense>      </Canvas>
      <ModelSelector currentColors={colors} />
      {explodeViewEnabled && (
        <ExplodeControls 
          onExplodeChange={handleExplodeChange}
          initialExplode={explodeAmount}
        />
      )}
      <ColorControls 
        materials={currentModel.materials}
        onChange={handleColorChange}
        initialColors={colors}
      />
    </div>
  )
}
