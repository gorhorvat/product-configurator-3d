import { useEffect, useMemo, useRef, useState } from 'react'
import { Color, Group, MeshStandardMaterial, Vector3 } from 'three'
import * as THREE from 'three'
import { useFBX, useTexture, Text } from '@react-three/drei'
import type { ModelPreset } from '../../data/modelPresets'
import type { DynamicColors } from '../ColorControls'
import { collectMeshes, computeAutoFit, computeRadialDirections } from '../../three/meshUtils'

interface Props {
  colors: DynamicColors
  modelPreset: ModelPreset
  explodeAmount: number
}

// Body-tinted renderer for FBX models. Replaces the imported material with a
// fresh MeshStandardMaterial so texture/color binding is predictable, then
// applies radial explode offsets like the GLB body renderer.
export function FBXConfigurator({ colors, modelPreset, explodeAmount }: Props) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  const modelPath = import.meta.env.BASE_URL + modelPreset.path
  const fbx = useFBX(modelPath)
  // Clone so swapping materials doesn't mutate the cached original.
  const scene = useMemo(() => fbx.clone(true), [fbx])

  const texturePaths = modelPreset.textures ?? {}
  const textureUrls = useMemo(() => {
    const base = import.meta.env.BASE_URL
    return {
      map: texturePaths.baseColor ? base + texturePaths.baseColor : undefined,
      normalMap: texturePaths.normal ? base + texturePaths.normal : undefined,
      roughnessMap: texturePaths.roughness ? base + texturePaths.roughness : undefined,
      metalnessMap: texturePaths.metallic ? base + texturePaths.metallic : undefined,
    }
  }, [texturePaths.baseColor, texturePaths.normal, texturePaths.roughness, texturePaths.metallic])

  const presentUrls = Object.values(textureUrls).filter((u): u is string => Boolean(u))
  const loadedTextures = useTexture(presentUrls)
  const textureMap = useMemo(() => {
    const out: Record<string, THREE.Texture | undefined> = {}
    let i = 0
    for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap'] as const) {
      if (textureUrls[key]) out[key] = loadedTextures[i++]
    }
    return out
  }, [textureUrls, loadedTextures])

  const { autoFitScale, modelCenter, meshOffsets } = useMemo(() => {
    const { fit, center, radius } = computeAutoFit(scene)
    const meshes = collectMeshes(scene)
    const offsets = computeRadialDirections(meshes, center, radius)
    return { autoFitScale: fit, modelCenter: center, meshOffsets: offsets }
  }, [scene])

  useEffect(() => {
    if (!scene) return

    const bodyConfig = modelPreset.materials.find(m => m.id === 'body') ?? modelPreset.materials[0]
    const currentColor = bodyConfig ? (colors[bodyConfig.id] || bodyConfig.defaultColor) : '#ffffff'
    const finalColor = new Color(currentColor)
    if (hovered) finalColor.multiplyScalar(1.2)

    scene.traverse(child => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      if (!mesh.userData.__configured) {
        const newMat = new MeshStandardMaterial({
          color: finalColor,
          map: textureMap.map,
          normalMap: textureMap.normalMap,
          roughnessMap: textureMap.roughnessMap,
          metalnessMap: textureMap.metalnessMap,
          metalness: textureMap.metalnessMap ? 1.0 : 0.2,
          roughness: textureMap.roughnessMap ? 1.0 : 0.6,
        })
        if (newMat.map) newMat.map.colorSpace = THREE.SRGBColorSpace
        mesh.material = newMat
        mesh.userData.__configured = true
        mesh.userData.__basePosition = mesh.position.clone()
      }

      // Skip shadow casting on FBX meshes — typically very high-poly and
      // shadow-map rendering kills framerate.
      mesh.castShadow = false
      mesh.receiveShadow = false
      const mat = mesh.material as MeshStandardMaterial
      mat.color.copy(finalColor)
      mat.envMapIntensity = hovered ? 1.5 : 1
      mat.needsUpdate = true

      const basePos: Vector3 | undefined = mesh.userData.__basePosition
      const dir = meshOffsets.get(mesh.uuid)
      if (basePos && dir) {
        const scaled = dir.clone().multiplyScalar(explodeAmount)
        mesh.position.copy(basePos).add(scaled)
      }
    })
  }, [scene, hovered, colors, modelPreset, explodeAmount, textureMap, meshOffsets])

  if (!scene) {
    return (
      <group ref={group}>
        <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="orange" /></mesh>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="orange">Loading model...</Text>
      </group>
    )
  }

  const presetScale = modelPreset.scale ?? [1, 1, 1]
  const finalScale: [number, number, number] = [
    presetScale[0] * autoFitScale,
    presetScale[1] * autoFitScale,
    presetScale[2] * autoFitScale,
  ]

  return (
    <group
      ref={group}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      rotation={modelPreset.rotation ?? [0, 0, 0]}
      scale={finalScale}
      position={modelPreset.position ?? [0, 0, 0]}
    >
      <group position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}>
        <primitive object={scene} />
      </group>
    </group>
  )
}
