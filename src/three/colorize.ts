import type * as THREE from 'three'

// Replaces the stock map_fragment so the base map acts as a luminance mask
// rather than an RGB multiplier. Lets very dark textures fully take the tint
// color while preserving relative shading (highlights, AO, etc.).
const COLORIZE_CHUNK = `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  float lum = dot(sampledDiffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  // Lift darks so even near-black texels pick up the tint.
  lum = lum * 0.7 + 0.3;
  diffuseColor.rgb *= lum;
  diffuseColor.a *= sampledDiffuseColor.a;
#endif
`

const injectColorize = (shader: { fragmentShader: string }) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    COLORIZE_CHUNK,
  )
}

const noopCompile = () => {}

type Patchable = THREE.Material & {
  map?: THREE.Texture | null
  onBeforeCompile: (shader: { fragmentShader: string }) => void
  customProgramCacheKey?: () => string
  needsUpdate: boolean
  userData: Record<string, unknown>
}

export function applyColorize(material: THREE.Material | null | undefined, enabled: boolean) {
  if (!material) return
  const m = material as Patchable
  if (!m.map) return

  const currentlyOn = m.userData.__colorize === true
  if (currentlyOn === enabled) return

  m.onBeforeCompile = enabled ? injectColorize : noopCompile
  m.customProgramCacheKey = () => (enabled ? 'colorize-on' : 'colorize-off')
  m.userData.__colorize = enabled
  m.needsUpdate = true
}

export function applyColorizeToMesh(mesh: THREE.Mesh, enabled: boolean) {
  const mat = mesh.material
  if (Array.isArray(mat)) mat.forEach(m => applyColorize(m, enabled))
  else applyColorize(mat, enabled)
}
