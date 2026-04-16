export interface MaterialConfig {
  id: string
  name: string
  description: string
  defaultColor: string
}

export interface ModelTextures {
  baseColor?: string
  normal?: string
  roughness?: string
  metallic?: string
}

export interface ModelPreset {
  id: string
  name: string
  path: string
  loader: 'gltf' | 'fbx'
  colorMode?: 'per-material' | 'body' | 'per-node'
  description: string
  materials: MaterialConfig[]
  textures?: ModelTextures
  scale?: [number, number, number]
  rotation?: [number, number, number]
  position?: [number, number, number]
  // Per-material explode vectors. When present, configurators use these fixed
  // directions instead of the radial fallback derived from mesh centers.
  explodeMap?: Record<string, [number, number, number]>
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'umber-alternate',
    name: 'Umber (alternate)',
    path: 'models/umber_model/umber_model_alternate.glb',
    loader: 'gltf',
    colorMode: 'per-node',
    description: 'Umber alternate — 12 separable parts',
    materials: [
      { id: 'tripo_part_1',  name: 'Right arm',       description: 'Right arm color',       defaultColor: '#ffffff' },
      { id: 'tripo_part_2',  name: 'Right shoulder',  description: 'Right shoulder color',  defaultColor: '#ffffff' },
      { id: 'tripo_part_3',  name: 'Right leg',       description: 'Right leg color',       defaultColor: '#ffffff' },
      { id: 'tripo_part_5',  name: 'Waist',           description: 'Waist color',           defaultColor: '#ffffff' },
      { id: 'tripo_part_7',  name: 'Chest',           description: 'Chest color',           defaultColor: '#ffffff' },
      { id: 'tripo_part_8',  name: 'Head - upper',    description: 'Head - upper color',    defaultColor: '#ffffff' },
      { id: 'tripo_part_9',  name: 'Head - lower',    description: 'Head - lower color',    defaultColor: '#ffffff' },
      { id: 'tripo_part_10', name: 'Codpiece',        description: 'Codpiece color',        defaultColor: '#ffffff' },
      { id: 'tripo_part_11', name: 'Belt',            description: 'Belt color',            defaultColor: '#ffffff' },
      { id: 'tripo_part_13', name: 'Left leg',        description: 'Left leg color',        defaultColor: '#ffffff' },
      { id: 'tripo_part_16', name: 'Left shoulder',   description: 'Left shoulder color',   defaultColor: '#ffffff' },
      { id: 'tripo_part_18', name: 'Left arm',        description: 'Left arm color',        defaultColor: '#ffffff' },
    ],
    scale: [1, 1, 1],
  },
  {
    id: 'umber',
    name: 'Umber',
    path: 'models/umber_model/umber_model.glb',
    loader: 'gltf',
    colorMode: 'per-node',
    description: 'Umber model — 9 separable parts',
    materials: [
      { id: 'tripo_part_0',  name: 'Right arm', description: 'Right arm color', defaultColor: '#ffffff' },
      { id: 'tripo_part_1',  name: 'Right leg', description: 'Right leg color', defaultColor: '#ffffff' },
      { id: 'tripo_part_5',  name: 'Head',      description: 'Head color',      defaultColor: '#ffffff' },
      { id: 'tripo_part_6',  name: 'Chest',     description: 'Chest color',     defaultColor: '#ffffff' },
      { id: 'tripo_part_7',  name: 'Pants',     description: 'Pants color',     defaultColor: '#ffffff' },
      { id: 'tripo_part_8',  name: 'Left leg',  description: 'Left leg color',  defaultColor: '#ffffff' },
      { id: 'tripo_part_9',  name: 'Left arm',  description: 'Left arm color',  defaultColor: '#ffffff' },
      { id: 'tripo_part_11', name: 'Weapon',    description: 'Weapon color',    defaultColor: '#ffffff' },
      { id: 'tripo_part_13', name: 'Crystal',   description: 'Crystal color',   defaultColor: '#ffffff' },
    ],
    scale: [1, 1, 1],
  },
  {
    id: 'aline',
    name: 'Aline',
    path: 'models/aline_model/aline_model.glb',
    loader: 'gltf',
    colorMode: 'per-node',
    description: 'Aline model — 11 separable parts',
    materials: [
      { id: 'tripo_part_0',     name: 'Right arm',      description: 'Right arm color',      defaultColor: '#ffffff' },
      { id: 'tripo_part_2',     name: 'Right shoulder', description: 'Right shoulder color', defaultColor: '#ffffff' },
      { id: 'tripo_part_3',     name: 'Right leg',      description: 'Right leg color',      defaultColor: '#ffffff' },
      { id: 'tripo_part_6',     name: 'Head',           description: 'Head color',           defaultColor: '#ffffff' },
      { id: 'tripo_part_7',     name: 'Chest',          description: 'Chest color',          defaultColor: '#ffffff' },
      { id: 'tripo_part_8',     name: 'Codpiece',       description: 'Codpiece color',       defaultColor: '#ffffff' },
      { id: 'tripo_part_10',    name: 'Cape',           description: 'Cape color',           defaultColor: '#ffffff' },
      { id: 'tripo_part_14',    name: 'Left leg',       description: 'Left leg color',       defaultColor: '#ffffff' },
      { id: 'tripo_part_15',    name: 'Left shoulder',  description: 'Left shoulder color',  defaultColor: '#ffffff' },
      { id: 'tripo_part_16',    name: 'Left arm',       description: 'Left arm color',       defaultColor: '#ffffff' },
      { id: 'tripo_part_new_0', name: 'Weapon',         description: 'Weapon color',         defaultColor: '#ffffff' },
    ],
    scale: [1, 1, 1],
  },
  {
    id: 'ps5-dualsense-modified',
    name: 'PlayStation 5 DualSense',
    path: 'models/playstation_5_dualsense/dualsense_controller.gltf',
    loader: 'gltf',
    description: 'Custom Sony PlayStation 5 wireless controller',
    materials: [
      { id: 'frontPlateLowerMaskColor', name: 'Front Plate Lower', description: 'Lower front plate section',    defaultColor: '#1a1a1a' },
      { id: 'frontPlateSideMasksColor', name: 'Front Plate Sides', description: 'Side sections of front plate', defaultColor: '#ffffff' },
      { id: 'frontPlateTouchpadColor',  name: 'Touchpad',          description: 'Touchpad surface',             defaultColor: '#ffffff' },
      { id: 'backPlateColor',           name: 'Back Plate',        description: 'Controller back shell',        defaultColor: '#ffffff' },
      { id: 'actionButtonsColor',       name: 'Action Buttons',    description: 'X, O, Triangle, Square buttons', defaultColor: '#ffffff' },
      { id: 'directionalButtonsColor',  name: 'D-Pad',             description: 'Directional buttons',          defaultColor: '#ffffff' },
      { id: 'triggersColor',            name: 'Triggers',          description: 'L1, L2, R1, R2 triggers',      defaultColor: '#1a1a1a' },
      { id: 'analogsColor',             name: 'Analog Sticks',     description: 'Left and right analog sticks', defaultColor: '#333333' },
      { id: 'optionsShareButtonColor',  name: 'Options/Share',     description: 'Options and Share buttons',    defaultColor: '#e0e0e0' },
      { id: 'psButtonColor',            name: 'PS Button',         description: 'PlayStation logo button',      defaultColor: '#1a1a1a' },
    ],
    scale: [2, 2, 2],
    rotation: [0, Math.PI, 0],
    explodeMap: {
      frontPlateOutlineColor:    [0,    0.2,  0.8],
      frontPlateLowerMaskColor:  [0,   -0.5,  0.7],
      frontPlateSideMasksColor:  [0.8,  0,    0.5],
      frontPlateTouchpadColor:   [0,    0.4,  1.2],
      backPlateColor:            [0,    0,   -1.0],
      actionButtonsColor:        [0.7,  0.4,  0.8],
      directionalButtonsColor:  [-0.7,  0.4,  0.8],
      triggersColor:             [0,    0.8,  0.3],
      analogsColor:              [0,    0.5,  0.6],
      optionsShareButtonColor:   [0,    0.3,  0.7],
      psButtonColor:             [0,    0.2,  1.5],
    },
  },
]
