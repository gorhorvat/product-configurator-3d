import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, SoftShadows } from '@react-three/drei'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { Configurator } from './Configurator.tsx'
import { ColorControls, type DynamicColors } from './ColorControls.tsx'
import { ModelSelector, MODEL_PRESETS, type ModelPreset } from './ModelSelector.tsx'
import { ExplodeControls } from './ExplodeControls.tsx'
import { Toolbar } from './Toolbar.tsx'

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666666" />
    </mesh>
  )
}

function Shadows() {
  return <SoftShadows size={25} samples={20} focus={0.5} />
}

const buildDefaultColors = (preset: ModelPreset): DynamicColors => {
  const out: DynamicColors = {}
  preset.materials.forEach(m => { out[m.id] = m.defaultColor })
  return out
}

export function Scene() {
  const [currentModelId, setCurrentModelId] = useState<string>(MODEL_PRESETS[0].id)
  const currentModel = useMemo(
    () => MODEL_PRESETS.find(m => m.id === currentModelId) ?? MODEL_PRESETS[0],
    [currentModelId]
  )

  // Keep a separate color map per model so switching back restores choices
  const [colorsByModel, setColorsByModel] = useState<Record<string, DynamicColors>>(() => {
    const init: Record<string, DynamicColors> = {}
    MODEL_PRESETS.forEach(p => { init[p.id] = buildDefaultColors(p) })
    return init
  })

  const colors = colorsByModel[currentModel.id] ?? buildDefaultColors(currentModel)

  const [explodeAmount, setExplodeAmount] = useState(0)
  const [explodeViewEnabled, setExplodeViewEnabled] = useState(false)
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(true)
  const [colorPanelOpen, setColorPanelOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return !window.matchMedia('(max-width: 768px)').matches
  })

  const handleColorChange = useCallback((newColors: DynamicColors) => {
    setColorsByModel(prev => ({ ...prev, [currentModel.id]: newColors }))
  }, [currentModel.id])

  const handleExplodeChange = useCallback((newExplodeAmount: number) => {
    setExplodeAmount(newExplodeAmount)
  }, [])

  const handleExplodeViewToggle = useCallback((enabled: boolean) => {
    setExplodeViewEnabled(enabled)
    if (!enabled) setExplodeAmount(0)
  }, [])

  const handleResetColors = useCallback(() => {
    setColorsByModel(prev => ({ ...prev, [currentModel.id]: buildDefaultColors(currentModel) }))
  }, [currentModel])

  const handleAutoRotateToggle = useCallback((enabled: boolean) => {
    setAutoRotateEnabled(enabled)
  }, [])

  const handleModelChange = useCallback((modelId: string) => {
    setCurrentModelId(modelId)
    setExplodeAmount(0)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Toolbar
        explodeViewEnabled={explodeViewEnabled}
        onExplodeViewToggle={handleExplodeViewToggle}
        autoRotateEnabled={autoRotateEnabled}
        onAutoRotateToggle={handleAutoRotateToggle}
        onResetColors={handleResetColors}
        modelName={currentModel.name}
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
          <Configurator
            key={currentModel.id}
            colors={colors}
            modelPreset={currentModel}
            explodeAmount={explodeAmount}
          />
          <OrbitControls
            autoRotate={autoRotateEnabled}
            autoRotateSpeed={1.0}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.2}
            minDistance={1.0}
            maxDistance={6}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
      <ModelSelector
        currentColors={colors}
        currentModelId={currentModel.id}
        onModelChange={handleModelChange}
      />
      {explodeViewEnabled && (
        <ExplodeControls
          onExplodeChange={handleExplodeChange}
          initialExplode={explodeAmount}
        />
      )}
      <button
        type="button"
        className={`color-controls-toggle${colorPanelOpen ? ' is-open' : ''}`}
        onClick={() => setColorPanelOpen(o => !o)}
        aria-label={colorPanelOpen ? 'Hide color controls' : 'Show color controls'}
        aria-expanded={colorPanelOpen}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.37-.6-.37-.99 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4A1.5 1.5 0 1 1 9.5 5a1.5 1.5 0 0 1 0 3zm5 0A1.5 1.5 0 1 1 14.5 5a1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
        </svg>
      </button>
      {colorPanelOpen && (
        <ColorControls
          key={currentModel.id}
          materials={currentModel.materials}
          onChange={handleColorChange}
          initialColors={colors}
          onClose={() => setColorPanelOpen(false)}
        />
      )}
    </div>
  )
}
