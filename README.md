# 3D Product Configurator

A modern 3D product configurator built with React Three Fiber, featuring real-time color customization, exploded views, and a switchable model library.

## Features

- **Model switcher** — dropdown to pick between multiple 3D models (Aline, Umber, PlayStation 5 DualSense).
- **Per-part color customization** — tint individual parts of a model via color pickers. Each model defines its own list of parts.
- **Move-parts mode** — click a mesh on the model (or a part in the color list) to select it, then drag the gizmo to reposition. Right-click a part to snap it back. Selection is bidirectional between the 3D view and the parts list.
- **Explode view** — slider that separates a model's sub-meshes so the internal structure is visible. GLB body/per-node models explode radially from the center; per-material models use fixed vectors from the preset.
- **Auto-fit + re-centering** — GLB models are automatically sized and centered regardless of their export units.
- **Hover highlight**, **orbit / auto-rotate**, and configurable **background color**.
- **HTML loading spinner** shown inside the Canvas while models stream in.
- **TypeScript**, fully typed.

## Supported model types

| Loader | Color mode | Renderer | Behavior |
| ------ | ---------- | -------- | -------- |
| `gltf` / `.glb` | `per-material` | `PerMaterialConfigurator` | Per-material tinting keyed by the material name. Uses fixed explode vectors from `modelPreset.explodeMap`. Used by the PS5 model. |
| `gltf` / `.glb` | `per-node` | `BodyTintedConfigurator` | Per-part tinting: looks up each mesh's ancestor node name in the preset's material list. Material is cloned per mesh so parts can be tinted independently while embedded textures are preserved. Used by the Aline and Umber models. |
| `gltf` / `.glb` | `body` | `BodyTintedConfigurator` | Single-color tint applied to every mesh in the model. |
| `fbx` | `body` | `FBXConfigurator` | Same as GLB body mode, plus ability to load external PBR textures (baseColor / normal / roughness / metallic) per preset. |

Selection state, gizmo wiring, and event plumbing are shared across GLTF renderers via the `useMeshSelection` hook and `SelectionGizmo` component. Auto-fit and radial-offset math live in `src/three/meshUtils.ts`.

## Tech Stack

- **React 19** — UI framework
- **Three.js** — 3D graphics library
- **React Three Fiber** — React renderer for Three.js
- **React Three Drei** — helpers (useGLTF, useFBX, useTexture, OrbitControls, Environment, SoftShadows)
- **TypeScript**
- **Vite**

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Fix ESLint issues automatically
- `npm run type-check` — Check TypeScript types

## Project Structure

```
public/
└── models/                            # 3D assets (GLTF / GLB / FBX + textures)

src/
├── data/
│   └── modelPresets.ts                # MODEL_PRESETS data + ModelPreset / MaterialConfig types
├── three/
│   ├── textures.ts                    # 4K texture upgrade (anisotropy + trilinear filtering)
│   └── meshUtils.ts                   # collectMeshes, computeAutoFit, computeRadialDirections
├── hooks/
│   └── useMeshSelection.ts            # Selection state + two-way parent sync + event handlers
├── components/
│   ├── Configurator.tsx               # Thin router — dispatches to a concrete renderer
│   ├── configurators/
│   │   ├── BodyTintedConfigurator.tsx # GLB body + per-node renderer
│   │   ├── PerMaterialConfigurator.tsx# GLTF per-material renderer (e.g. PS5)
│   │   └── FBXConfigurator.tsx        # FBX body renderer with external PBR textures
│   ├── SelectionGizmo.tsx             # Wraps drei TransformControls for move-parts mode
│   ├── Scene.tsx                      # Canvas, lights, camera, top-level state
│   ├── ModelSelector.tsx              # Model dropdown UI (pure, no data)
│   ├── ColorControls.tsx              # Per-part color pickers + list-based selection
│   ├── ExplodeControls.tsx            # Explode-view slider + presets
│   └── Toolbar.tsx                    # Background color, move-parts, auto-rotate, explode, config
├── App.tsx
├── App.css
└── types.d.ts
```

## Adding a new model

1. Drop the model file under `public/models/<model_name>/`.
2. Append a new entry to `MODEL_PRESETS` in `src/data/modelPresets.ts`:
   ```ts
   {
     id: 'my-model',
     name: 'My Model',
     path: 'models/my_model/my_model.glb',
     loader: 'gltf',                          // or 'fbx'
     colorMode: 'per-node',                   // 'per-material' | 'body' | 'per-node'
     description: 'Short description',
     materials: [
       { id: 'node_name_in_file', name: 'Part Label', description: '...', defaultColor: '#ffffff' },
       // ...
     ],
     // Optional fixed-direction explode offsets (per-material renderers only):
     // explodeMap: { node_name_in_file: [x, y, z], ... }
     // Optional FBX-only textures:
     // textures: { baseColor, normal, roughness, metallic }
   }
   ```
3. For `per-node` models, the `id` of each material must match a node name inside the GLB. Inspect the file to see node names — from the project root:
   ```bash
   node -e "const fs=require('fs');const b=fs.readFileSync('public/models/<your.glb>');const n=b.readUInt32LE(12);const g=JSON.parse(b.slice(20,20+n).toString());(g.nodes||[]).forEach((x,i)=>console.log(i,x.name))"
   ```
4. Pick colors one by one at runtime to verify which preset entry maps to which visible part, then rename `name` / `description` accordingly.

## Performance notes

- FBX meshes skip shadow casting by default — they are usually high-poly and shadow-map rendering is the dominant cost.
- Materials on GLBs in `per-node` mode are cloned once at setup so subsequent tint updates don't trigger full material rebuilds.
- Bounding-box computation (auto-fit + explode direction) runs once per loaded scene, not every frame.

## Deployment

This project includes GitHub Actions for automatic deployment to GitHub Pages.

### Manual Deployment

```bash
npm run build
npm run preview  # Test the build locally
```

### GitHub Pages Setup

1. Enable GitHub Pages in your repository settings
2. Set source to "GitHub Actions"
3. Push to main branch to trigger automatic deployment

## Live Demo

Once deployed, your app will be available at:
[Product configurator 3D live page](https://gorhorvat.github.io/product-configurator-3d/)

## License

MIT License
