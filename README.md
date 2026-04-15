# 3D Product Configurator

A modern 3D product configurator built with React Three Fiber, featuring real-time color customization, exploded views, and a switchable model library.

## Features

- **Model switcher** — dropdown to pick between multiple 3D models (Aline, Umber, PlayStation 5 DualSense).
- **Per-part color customization** — tint individual parts of a model via color pickers. Each model defines its own list of parts.
- **Explode view** — slider that separates a model's sub-meshes radially from the center so the internal structure is visible.
- **Auto-fit + re-centering** — GLB models are automatically sized and centered regardless of their export units.
- **Hover highlight** and **orbit / auto-rotate** camera controls.
- **TypeScript**, fully typed.

## Supported model types

| Loader | Color mode | Behavior |
| ------ | ---------- | -------- |
| `gltf` / `.glb` | `per-material` | Per-material tinting keyed by the material name (used by the PS5 model). |
| `gltf` / `.glb` | `per-node` | Per-part tinting: looks up each mesh's ancestor node name in the preset's material list. Material is cloned per mesh so parts can be tinted independently while embedded textures are preserved. Used by the Aline and Umber humanoid models. |
| `gltf` / `.glb` | `body` | Single-color tint applied to every mesh in the model. |
| `fbx` | `body` | Same as GLB body mode, plus ability to load external PBR textures (baseColor / normal / roughness / metallic) per preset. |

All non-PS5 modes share a common `BodyTintedScene` renderer that handles auto-fit, re-centering, and radial explode offsets.

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
└── models/                       # 3D assets (GLTF / GLB / FBX + textures)

src/
├── components/
│   ├── Configurator.tsx          # Top-level model renderer; dispatches to the right loader path
│   ├── Scene.tsx                 # Canvas, lights, camera, per-model color state
│   ├── ModelSelector.tsx         # Model presets (MODEL_PRESETS) + dropdown UI
│   ├── ColorControls.tsx         # Per-part color pickers (driven by the preset's materials)
│   ├── ExplodeControls.tsx       # Explode-view slider
│   └── Toolbar.tsx               # Auto-rotate, explode toggle, reset-colors
├── App.tsx
├── App.css
└── types.d.ts
```

## Adding a new model

1. Drop the model file under `public/models/<model_name>/`.
2. Append a new entry to `MODEL_PRESETS` in `src/components/ModelSelector.tsx`:
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
