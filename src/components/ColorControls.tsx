import { useState, useCallback, useEffect, useMemo } from 'react'
import type { MaterialConfig } from './ModelSelector'

export type DynamicColors = Record<string, string>

interface ColorControlsProps {
  materials: MaterialConfig[]
  onChange: (colors: DynamicColors) => void
  initialColors?: DynamicColors
}

export function ColorControls({ materials, onChange, initialColors }: ColorControlsProps) {
  // Memoize initial colors to prevent unnecessary recalculations
  const initialColorsState = useMemo(() => {
    const colors: DynamicColors = {}
    materials.forEach(material => {
      colors[material.id] = initialColors?.[material.id] || material.defaultColor
    })
    return colors
  }, [materials, initialColors])

  const [colors, setColors] = useState<DynamicColors>(initialColorsState)

  // Update colors when materials change
  useEffect(() => {
    setColors(initialColorsState)
  }, [initialColorsState])
  // Notify parent of color changes with debouncing to prevent rapid updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only call onChange if colors have actually changed from initial state
      const hasChanged = Object.keys(colors).some(key => 
        colors[key] !== initialColorsState[key]
      )
      
      if (hasChanged || Object.keys(colors).length > 0) {
        onChange(colors)
      }
    }, 16) // ~60fps debouncing to prevent rapid fire updates

    return () => clearTimeout(timeoutId)
  }, [colors]) // Remove onChange from dependencies to prevent infinite loop
  const handleColorChange = useCallback((materialId: string, color: string) => {
    setColors(prevColors => ({
      ...prevColors,
      [materialId]: color
    }))
  }, [])

  return (
    <div className="color-controls">
      <div className="color-controls-grid">
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
    </div>
  )
}
