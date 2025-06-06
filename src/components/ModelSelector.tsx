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

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'ps5-dualsense',
    name: 'PlayStation 5 DualSense',
    path: 'models/playstation_5_dualsense/scene.gltf',
    description: 'Sony PlayStation 5 wireless controller',
    materials: [
      {
        id: '1011',
        name: 'Front Plate',
        description: 'Controller front face and light bar',
        defaultColor: '#ffffff'
      },
      {
        id: '1001',
        name: 'Buttons',
        description: 'Action buttons and D-pad',
        defaultColor: '#303030'
      },
      {
        id: '1002',
        name: 'Back Plate',
        description: 'Controller back shell',
        defaultColor: '#ffffff'
      }
    ],
    scale: [2, 2, 2],
    rotation: [0.2, 0, 0]
  }
]

export function ModelSelector() {
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
                style={{ backgroundColor: material.defaultColor }}
                title={material.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
