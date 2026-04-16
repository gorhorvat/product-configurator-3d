import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Color, Group, Vector3 } from 'three'
import * as THREE from 'three'
import { useGLTF, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { ModelPreset } from '../../data/modelPresets'
import type { DynamicColors } from '../ColorControls'
import { upgradeMeshTextures } from '../../three/textures'
import { applyColorizeToMesh } from '../../three/colorize'
import { useMeshSelection } from '../../hooks/useMeshSelection'
import { SelectionGizmo } from '../SelectionGizmo'

type MeshInfo = { cfgId?: string; explodeVec: [number, number, number] }

interface Props {
  colors: DynamicColors
  modelPreset: ModelPreset
  explodeAmount: number
  selectionEnabled: boolean
  onDraggingChange?: (dragging: boolean) => void
  selectedPartId: string | null
  onSelectedPartChange?: (id: string | null) => void
  colorizeMode?: boolean
}

// Renderer for GLTF models that are already authored with per-material tinting
// (materials are named after part ids). Uses fixed per-material explode vectors
// from `modelPreset.explodeMap` with a mesh-name-based fallback for unmapped
// meshes. Applies model-specific material tweaks for known part types.
export function PerMaterialConfigurator({
  colors,
  modelPreset,
  explodeAmount,
  selectionEnabled,
  onDraggingChange,
  selectedPartId,
  onSelectedPartChange,
  colorizeMode = false,
}: Props) {
  const group = useRef<Group>(null)
  const manualOffsetsRef = useRef<Map<string, Vector3>>(new Map())
  const gl = useThree(state => state.gl)
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl])

  const modelPath = import.meta.env.BASE_URL + modelPreset.path
  const { scene } = useGLTF(modelPath)

  const explodeMap = modelPreset.explodeMap ?? {}

  const getExplodeVec = useCallback((key: string): [number, number, number] => {
    return explodeMap[key] ?? [0, 0, 0]
  }, [explodeMap])

  const byUuid = useMemo(() => {
    const map = new Map<string, MeshInfo>()
    if (!scene) return map
    const idSet = new Set(modelPreset.materials.map(m => m.id))
    scene.traverse(child => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh || !mesh.material) return
      const matName = Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material.name
      const cfgId = matName && idSet.has(matName) ? matName : undefined

      let explodeVec: [number, number, number]
      if (cfgId) {
        explodeVec = getExplodeVec(cfgId)
      } else {
        const meshName = child.name || ''
        if (meshName.includes('front') || meshName.includes('Front')) explodeVec = [0, 0.1, 0.5]
        else if (meshName.includes('back') || meshName.includes('Back')) explodeVec = [0, 0, -0.5]
        else if (meshName.includes('button') || meshName.includes('Button')) explodeVec = [0, 0.3, 0.3]
        else explodeVec = [0, 0, 0]
      }
      map.set(child.uuid, { cfgId, explodeVec })
    })
    return map
  }, [scene, modelPreset, getExplodeVec])

  const resetMesh = useCallback((mesh: THREE.Object3D, info: MeshInfo) => {
    manualOffsetsRef.current.delete(mesh.uuid)
    const v = info.explodeVec
    mesh.position.set(v[0] * explodeAmount, v[1] * explodeAmount, v[2] * explodeAmount)
  }, [explodeAmount])

  const commitDrag = useCallback((mesh: THREE.Object3D, info: MeshInfo) => {
    const v = info.explodeVec
    const explodeOffset = new Vector3(v[0] * explodeAmount, v[1] * explodeAmount, v[2] * explodeAmount)
    const manual = mesh.position.clone().sub(explodeOffset)
    manualOffsetsRef.current.set(mesh.uuid, manual)
  }, [explodeAmount])

  const { hovered, selectedUuid, selectedObject, groupHandlers, transformHandlers } =
    useMeshSelection<MeshInfo>({
      scene: scene as THREE.Object3D,
      byUuid,
      selectionEnabled,
      selectedPartId,
      onSelectedPartChange,
      onDraggingChange,
      onResetMesh: resetMesh,
      onCommitDrag: commitDrag,
    })

  useEffect(() => {
    if (!scene || !modelPreset) return

    scene.traverse(child => {
      const mesh = child as THREE.Mesh & { material: THREE.MeshStandardMaterial }
      if (!mesh.isMesh || !mesh.material) return

      upgradeMeshTextures(mesh, maxAnisotropy)
      mesh.material.transparent = false
      mesh.material.opacity = 1
      mesh.material.depthWrite = true
      mesh.material.depthTest = true
      mesh.castShadow = true
      mesh.receiveShadow = true

      const materialName = mesh.material.name
      const materialConfig = modelPreset.materials.find(m => m.id === materialName)
      const isSelected = mesh.uuid === selectedUuid
      const info = byUuid.get(mesh.uuid)

      const applyPosition = (vec: [number, number, number]) => {
        // TransformControls drives the selected mesh's position directly.
        if (isSelected) return
        const manual = manualOffsetsRef.current.get(mesh.uuid)
        mesh.position.set(vec[0] * explodeAmount, vec[1] * explodeAmount, vec[2] * explodeAmount)
        if (manual) mesh.position.add(manual)
      }

      if (materialConfig) {
        applyPosition(info?.explodeVec ?? getExplodeVec(materialConfig.id))

        const currentColor = colors[materialConfig.id] || materialConfig.defaultColor
        const finalColor = new Color(currentColor)
        if (hovered) finalColor.multiplyScalar(1.2)
        if (isSelected) finalColor.lerp(new Color('#ffeb3b'), 0.35)
        mesh.material.color.copy(finalColor)
        if (mesh.material.emissive && isSelected) {
          mesh.material.emissive.setHex(0xffaa00)
          if (mesh.material.emissiveIntensity !== undefined) mesh.material.emissiveIntensity = 0.35
        }

        const isButtonMaterial = materialConfig.id === 'actionButtonsColor' || materialConfig.id === 'directionalButtonsColor'
        const hasBaseTexture = mesh.material.map !== null

        if (isButtonMaterial && hasBaseTexture) {
          mesh.material.alphaTest = 0.0
          if (mesh.material.map) {
            mesh.material.map.minFilter = THREE.LinearMipmapLinearFilter
            mesh.material.map.magFilter = THREE.LinearFilter
          }
        } else if (materialConfig.id === 'frontPlateSideMasksColor') {
          mesh.material.alphaTest = 0.0
          mesh.material.side = THREE.FrontSide
          mesh.material.metalness = 0.2
          mesh.material.roughness = 0.3
          if (mesh.material.emissive) mesh.material.emissive.setHex(0x000000)
          if (mesh.material.emissiveIntensity !== undefined) mesh.material.emissiveIntensity = 0
          mesh.material.toneMapped = true
          mesh.material.vertexColors = false
          mesh.material.color.copy(finalColor)
        } else if (mesh.material.emissive) {
          mesh.material.emissive.copy(finalColor)
          mesh.material.emissive.multiplyScalar(0.3)
          if (mesh.material.emissiveIntensity !== undefined) mesh.material.emissiveIntensity = 0.3
        }

        if (materialConfig.id === 'glass') {
          mesh.material.transparent = true
          mesh.material.opacity = 0.8
          mesh.material.metalness = 0.9
          mesh.material.roughness = 0.1
        } else if (materialConfig.id === 'frontPlateTouchpadColor') {
          mesh.material.metalness = 0.1
          mesh.material.roughness = 0.8
          if (mesh.material.emissive) {
            mesh.material.emissive.copy(finalColor)
            mesh.material.emissive.multiplyScalar(0.2)
          }
        } else if (isButtonMaterial) {
          mesh.material.metalness = 0.1
          mesh.material.roughness = 0.9
          mesh.material.alphaTest = 0.0
          if (mesh.material.normalMap) mesh.material.normalScale.set(1.2, 1.2)
        } else if (materialConfig.id !== 'frontPlateSideMasksColor') {
          mesh.material.metalness = 0.5
          mesh.material.roughness = 0.2
        }

        mesh.material.envMapIntensity = hovered ? 1.5 : 1
        if (mesh.material.normalMap) mesh.material.normalScale.set(1, 1)
      } else {
        if (materialName === 'frontPlateOutlineColor') {
          mesh.material.color.copy(new Color('#ffffff'))
          applyPosition(info?.explodeVec ?? getExplodeVec('frontPlateOutlineColor'))
        } else {
          applyPosition(info?.explodeVec ?? [0, 0, 0])
        }
        mesh.material.metalness = 0.5
        mesh.material.roughness = 0.2
      }
      applyColorizeToMesh(mesh, colorizeMode)
      mesh.material.needsUpdate = true
    })
  }, [scene, hovered, colors, modelPreset, explodeAmount, maxAnisotropy, byUuid, selectedUuid, getExplodeVec, colorizeMode])

  if (!scene) {
    return (
      <group ref={group}>
        <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="orange" /></mesh>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="orange">Loading model...</Text>
      </group>
    )
  }

  return (
    <>
      <group
        ref={group}
        {...groupHandlers}
        rotation={modelPreset.rotation ?? [0, 0, 0]}
        scale={modelPreset.scale ?? [2, 2, 2]}
        position={modelPreset.position ?? [0, 0, 0]}
      >
        <primitive object={scene} />
      </group>
      <SelectionGizmo object={selectedObject} enabled={selectionEnabled} {...transformHandlers} />
    </>
  )
}
