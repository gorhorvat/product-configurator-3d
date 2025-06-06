import { useState, useCallback, useEffect } from 'react'
import type { MaterialConfig } from './ModelSelector'

export type DynamicColors = Record<string, string>

interface ColorControlsProps {
  materials: MaterialConfig[]
  onChange: (colors: DynamicColors) => void
  initialColors?: DynamicColors
}

export function ColorControls({ materials, onChange, initialColors }: ColorControlsProps) {
  // Initialize colors from materials' default colors
  const getInitialColors = useCallback(() => {
    const colors: DynamicColors = {}
    materials.forEach(material => {
      colors[material.id] = initialColors?.[material.id] || material.defaultColor
    })
    return colors
  }, [materials, initialColors])

  const [colors, setColors] = useState<DynamicColors>(getInitialColors())

  // Update colors when materials change (model switch)
  useEffect(() => {
    const newColors = getInitialColors()
    setColors(newColors)
    onChange(newColors)
  }, [materials, getInitialColors, onChange])

  const handleColorChange = useCallback((materialId: string, color: string) => {
    const newColors = { ...colors, [materialId]: color }
    setColors(newColors)
    onChange(newColors)
  }, [colors, onChange])

  return (
    <div className="color-controls">
      {materials.map((material) => (
        <div key={material.id} className="control-group">
          <label>
            <span className="material-name">{material.name}</span>
            <span className="material-description">{material.description}</span>
          </label>
          <input
            type="color"
            value={colors[material.id] || material.defaultColor}
            onChange={(e) => handleColorChange(material.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}
