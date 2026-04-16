import { Box3, Vector3 } from 'three'
import type * as THREE from 'three'

export function collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const list: THREE.Mesh[] = []
  root.traverse(child => {
    if ((child as THREE.Mesh).isMesh) list.push(child as THREE.Mesh)
  })
  return list
}

// Computes a scale factor that normalizes the model to `targetSize` regardless
// of export units, plus its world-space center and radius.
export function computeAutoFit(scene: THREE.Object3D, targetSize = 1.2) {
  scene.updateMatrixWorld(true)
  const worldBox = new Box3().setFromObject(scene)
  const size = new Vector3()
  worldBox.getSize(size)
  const center = new Vector3()
  worldBox.getCenter(center)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const fit = targetSize / maxDim
  const radius = maxDim * 0.5
  return { fit, center, radius, size }
}

// Radial direction per mesh, sized to `radius`. Meshes coincident with the
// model center get a spiral fallback so a single-mesh model still visibly
// explodes.
export function computeRadialDirections(
  meshes: THREE.Mesh[],
  center: Vector3,
  radius: number,
): Map<string, Vector3> {
  const out = new Map<string, Vector3>()
  meshes.forEach((mesh, idx) => {
    const meshBox = new Box3().setFromObject(mesh)
    const meshCenter = new Vector3()
    meshBox.getCenter(meshCenter)
    const dir = meshCenter.clone().sub(center)
    if (dir.lengthSq() < 1e-6) {
      const angle = (idx / Math.max(1, meshes.length)) * Math.PI * 2
      dir.set(Math.cos(angle), 0.3, Math.sin(angle))
    }
    dir.normalize().multiplyScalar(radius)
    out.set(mesh.uuid, dir)
  })
  return out
}
