import { useState, useCallback } from 'react'
import type { Colors } from './Configurator'

interface ColorControlsProps {
  onChange: (colors: Colors) => void
}

const CONTROL_LABELS: Record<keyof Colors, string> = {
  BACK_PLATE: 'Back Plate',
  BUTTONS: 'Buttons',
  FRONT_PLATE: 'Front Plates'
}

export function ColorControls({ onChange }: ColorControlsProps) {
  const [colors, setColors] = useState<Colors>({
    BACK_PLATE: '#ffffff',
    BUTTONS: '#303030',
    FRONT_PLATE: '#ffffff'
  })

  const handleColorChange = useCallback((part: keyof Colors, color: string) => {
    const newColors = { ...colors, [part]: color }
    setColors(newColors)
    onChange(newColors)
  }, [colors, onChange])
  return (
    <div className="color-controls">
      {(Object.keys(CONTROL_LABELS) as Array<keyof Colors>).map((part) => (
        <div key={part} className="control-group">
          <label>{CONTROL_LABELS[part]}</label>
          <input
            type="color"
            value={colors[part]}
            onChange={(e) => handleColorChange(part, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}
