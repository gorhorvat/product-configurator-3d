import type { ModelPreset } from '../data/modelPresets'
import type { DynamicColors } from './ColorControls'
import { BodyTintedConfigurator } from './configurators/BodyTintedConfigurator'
import { PerMaterialConfigurator } from './configurators/PerMaterialConfigurator'
import { FBXConfigurator } from './configurators/FBXConfigurator'

interface ConfiguratorProps {
  colors?: DynamicColors
  modelPreset: ModelPreset
  explodeAmount?: number
  selectionEnabled?: boolean
  onDraggingChange?: (dragging: boolean) => void
  selectedPartId?: string | null
  onSelectedPartChange?: (id: string | null) => void
  colorizeMode?: boolean
}

// Dispatches to a concrete renderer based on loader + colorMode. Each
// renderer owns its own material/explode/selection mechanics.
export function Configurator({
  colors = {},
  modelPreset,
  explodeAmount = 0,
  selectionEnabled = false,
  onDraggingChange,
  selectedPartId = null,
  onSelectedPartChange,
  colorizeMode = false,
}: ConfiguratorProps) {
  if (modelPreset.loader === 'fbx') {
    return <FBXConfigurator colors={colors} modelPreset={modelPreset} explodeAmount={explodeAmount} />
  }

  const colorMode = modelPreset.colorMode ?? 'per-material'
  const Renderer = colorMode === 'body' || colorMode === 'per-node'
    ? BodyTintedConfigurator
    : PerMaterialConfigurator

  return (
    <Renderer
      colors={colors}
      modelPreset={modelPreset}
      explodeAmount={explodeAmount}
      selectionEnabled={selectionEnabled}
      onDraggingChange={onDraggingChange}
      selectedPartId={selectedPartId}
      onSelectedPartChange={onSelectedPartChange}
      colorizeMode={colorizeMode}
    />
  )
}
