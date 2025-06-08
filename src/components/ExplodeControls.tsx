import { useState, useCallback } from 'react'

export interface ExplodeControlsProps {
  onExplodeChange: (explodeAmount: number) => void
  initialExplode?: number
}

export function ExplodeControls({ onExplodeChange, initialExplode = 0 }: ExplodeControlsProps) {
  const [explodeAmount, setExplodeAmount] = useState(initialExplode)

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value)
    setExplodeAmount(value)
    onExplodeChange(value)
  }, [onExplodeChange])
  const handleReset = useCallback(() => {
    setExplodeAmount(0)
    onExplodeChange(0)
  }, [onExplodeChange])

  const handlePreset = useCallback((value: number) => {
    setExplodeAmount(value)
    onExplodeChange(value)
  }, [onExplodeChange])

  return (
    <div className="explode-controls">
      <div className="explode-controls-header">
        <h3>Explode View</h3>
        <button 
          className="reset-button" 
          onClick={handleReset}
          title="Reset to assembled view"
        >
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
        <button 
          className="preset-button" 
          onClick={() => handlePreset(0.25)}
          title="Partial explode view"
        >
          25%
        </button>
        <button 
          className="preset-button" 
          onClick={() => handlePreset(0.5)}
          title="Half exploded view"
        >
          50%
        </button>
        <button 
          className="preset-button" 
          onClick={() => handlePreset(0.75)}
          title="Mostly exploded view"
        >
          75%
        </button>
        <button 
          className="preset-button" 
          onClick={() => handlePreset(1.0)}
          title="Fully exploded view"
        >
          100%
        </button>
      </div>
    </div>
  )
}
