import type { DynamicColors } from './ColorControls'

// Define material configuration for each model
export interface MaterialConfig {
  id: string
  name: string
  description: string
  defaultColor: string
}

export interface ModelPreset {
  id: string
  name: string
  path: string
  description: string
  materials: MaterialConfig[]
  scale?: [number, number, number]
  rotation?: [number, number, number]
  position?: [number, number, number]
}

interface ModelSelectorProps {
  currentColors?: DynamicColors
}

export const MODEL_PRESETS: ModelPreset[] = [  {
    id: 'ps5-dualsense-modified',
    name: 'PlayStation 5 DualSense',
    path: 'models/playstation_5_dualsense/dualsense_controller.gltf',
    description: 'Custom Sony PlayStation 5 wireless controller',materials: [      {        id: 'frontPlateLowerMaskColor',
        name: 'Front Plate Lower',
        description: 'Lower front plate section',
        defaultColor: '#1a1a1a'
      },
      {        id: 'frontPlateSideMasksColor',
        name: 'Front Plate Sides',
        description: 'Side sections of front plate',
        defaultColor: '#ffffff'
      },      {        id: 'frontPlateTouchpadColor',
        name: 'Touchpad',
        description: 'Touchpad surface',
        defaultColor: '#ffffff'
      },
      {        id: 'backPlateColor',
        name: 'Back Plate',
        description: 'Controller back shell',
        defaultColor: '#ffffff'
      },      {        id: 'actionButtonsColor',
        name: 'Action Buttons',
        description: 'X, O, Triangle, Square buttons',
        defaultColor: '#ffffff'
      },{        id: 'directionalButtonsColor',
        name: 'D-Pad',
        description: 'Directional buttons',
        defaultColor: '#ffffff'
      },{        id: 'triggersColor',
        name: 'Triggers',
        description: 'L1, L2, R1, R2 triggers',
        defaultColor: '#1a1a1a'
      },
      {        id: 'analogsColor',
        name: 'Analog Sticks',
        description: 'Left and right analog sticks',
        defaultColor: '#333333'
      },
      {        id: 'optionsShareButtonColor',
        name: 'Options/Share',
        description: 'Options and Share buttons',
        defaultColor: '#e0e0e0'
      },      {        id: 'psButtonColor',
        name: 'PS Button',
        description: 'PlayStation logo button',
        defaultColor: '#1a1a1a'
      },
    ],
    scale: [2, 2, 2],
    rotation: [0, Math.PI, 0]
  }
]

export function ModelSelector({ currentColors = {} }: ModelSelectorProps) {
  const currentModel = MODEL_PRESETS[0] // Always use PS5 controller since it's the only one

  return (
    <div className="model-selector">
      <div className="model-selector-header">
        <h3>Model</h3>
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
