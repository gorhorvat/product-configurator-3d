import { useState, useRef, useEffect } from 'react'

interface ToolbarProps {
  explodeViewEnabled: boolean
  onExplodeViewToggle: (enabled: boolean) => void
  autoRotateEnabled: boolean
  onAutoRotateToggle: (enabled: boolean) => void
  onResetColors: () => void
}

export function Toolbar({ explodeViewEnabled, onExplodeViewToggle, autoRotateEnabled, onAutoRotateToggle, onResetColors }: ToolbarProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const configMenuRef = useRef<HTMLDivElement>(null)

  // Close config menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (configMenuRef.current && !configMenuRef.current.contains(event.target as Node)) {
        setIsConfigOpen(false)
      }
    }

    if (isConfigOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isConfigOpen])

  const toggleConfig = () => {
    setIsConfigOpen(!isConfigOpen)
  }
  const handleExplodeToggle = () => {
    onExplodeViewToggle(!explodeViewEnabled)
  }

  const handleAutoRotateToggle = () => {
    onAutoRotateToggle(!autoRotateEnabled)
  }
  return (
    <div className="toolbar">
      <div className="toolbar-content">
        <h1>Product Configurator</h1>
      </div>
      <div className="toolbar-actions">
        <div className="config-menu-container" ref={configMenuRef}>
          <button 
            className="config-button"
            onClick={toggleConfig}
            aria-label="Configuration menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
          
          {isConfigOpen && (
            <div className="config-menu">
              <div className="config-menu-header">
                <h3>Configuration</h3>
              </div>                <div className="config-options">
                  <div className="config-option">
                    <label className="config-toggle">
                      <input
                        type="checkbox"
                        checked={autoRotateEnabled}
                        onChange={handleAutoRotateToggle}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">Auto Rotate</span>
                    </label>
                  </div>
                  <div className="config-option">
                    <label className="config-toggle">
                      <input
                        type="checkbox"
                        checked={explodeViewEnabled}
                        onChange={handleExplodeToggle}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">Enable Explode View</span>
                    </label>
                  </div>
                  <div className="config-option">
                    <button 
                      className="config-reset-button"
                      onClick={onResetColors}
                      title="Reset all colors to defaults"
                    >
                      Reset Colors
                    </button>
                  </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
