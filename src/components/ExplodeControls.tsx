import { useState, useCallback } from 'react'

export interface ExplodeControlsProps {
  onExplodeChange: (explodeAmount: number) => void
  initialExplode?: number
}

const PRESETS: Array<{ value: number; label: string; title: string }> = [
  { value: 0.25, label: '25%',  title: 'Partial explode view' },
  { value: 0.5,  label: '50%',  title: 'Half exploded view' },
  { value: 0.75, label: '75%',  title: 'Mostly exploded view' },
  { value: 1.0,  label: '100%', title: 'Fully exploded view' },
]

export function ExplodeControls({ onExplodeChange, initialExplode = 0 }: ExplodeControlsProps) {
  const [explodeAmount, setExplodeAmount] = useState(initialExplode)

  const setAmount = useCallback((value: number) => {
    setExplodeAmount(value)
    onExplodeChange(value)
  }, [onExplodeChange])

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFloat(event.target.value))
  }, [setAmount])

  return (
    <div className="explode-controls">
      <div className="explode-controls-header">
        <h3>Explode View</h3>
        <button className="reset-button" onClick={() => setAmount(0)} title="Reset to assembled view">
          Reset
        </button>
      </div>

      <div className="explode-slider-container">
        <label htmlFor="explode-slider" className="explode-label">
          Explode Amount: {Math.round(explodeAmount * 100)}%
        </label>
        <input
          id="explode-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={explodeAmount}
          onChange={handleSliderChange}
          className="explode-slider"
        />
        <div className="explode-range-labels">
          <span>Assembled</span>
          <span>Exploded</span>
        </div>
      </div>
      <div className="explode-description">
        Drag the slider to separate controller components and see the internal structure
      </div>
      <div className="explode-presets">
        {PRESETS.map(p => (
          <button
            key={p.value}
            className="preset-button"
            onClick={() => setAmount(p.value)}
            title={p.title}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
