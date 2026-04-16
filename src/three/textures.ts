import * as THREE from 'three'

const TEXTURE_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'] as const

// Configure each texture on the material for high-res (4K+) rendering:
// max anisotropy + trilinear mipmap filtering. Without this, 4K textures look
// muddy at grazing angles. Idempotent — tracks upgrade state via userData.
export function upgradeMaterialTextures(mat: THREE.Material | null | undefined, maxAnisotropy: number) {
  if (!mat) return
  const m = mat as unknown as Record<string, THREE.Texture | undefined>
  for (const slot of TEXTURE_SLOTS) {
    const tex = m[slot]
    if (!tex || tex.userData.__upgraded) continue
    tex.anisotropy = maxAnisotropy
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.generateMipmaps = true
    tex.needsUpdate = true
    tex.userData.__upgraded = true
  }
}

export function upgradeMeshTextures(mesh: THREE.Mesh, maxAnisotropy: number) {
  const mat = mesh.material
  if (Array.isArray(mat)) mat.forEach(m => upgradeMaterialTextures(m, maxAnisotropy))
  else upgradeMaterialTextures(mat, maxAnisotropy)
}
