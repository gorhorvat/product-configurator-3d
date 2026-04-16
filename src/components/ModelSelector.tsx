import type { DynamicColors } from './ColorControls'
import { MODEL_PRESETS } from '../data/modelPresets'

interface ModelSelectorProps {
  currentColors?: DynamicColors
  currentModelId: string
  onModelChange: (modelId: string) => void
}

export function ModelSelector({ currentColors = {}, currentModelId, onModelChange }: ModelSelectorProps) {
  const currentModel = MODEL_PRESETS.find(m => m.id === currentModelId) ?? MODEL_PRESETS[0]

  return (
    <div className="model-selector">
      <div className="model-selector-header">
        <h3>Model</h3>
        <select
          className="model-dropdown"
          value={currentModel.id}
          onChange={(e) => onModelChange(e.target.value)}
        >
          {MODEL_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <div className="model-display">
          <div className="model-info">
            <div className="model-name">{currentModel.name}</div>
            <div className="model-description">{currentModel.description}</div>
          </div>
          <div className="color-preview">
            {currentModel.materials.map((material) => (
              <div
                key={material.id}
                className="color-dot"
                style={{ backgroundColor: currentColors[material.id] || material.defaultColor }}
                title={material.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
