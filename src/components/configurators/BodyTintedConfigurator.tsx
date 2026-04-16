import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Color, Group, Vector3 } from 'three'
import type * as THREE from 'three'
import { useGLTF, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { ModelPreset } from '../../data/modelPresets'
import type { DynamicColors } from '../ColorControls'
import { upgradeMeshTextures } from '../../three/textures'
import { collectMeshes, computeAutoFit, computeRadialDirections } from '../../three/meshUtils'
import { applyColorizeToMesh } from '../../three/colorize'
import { useMeshSelection } from '../../hooks/useMeshSelection'
import { SelectionGizmo } from '../SelectionGizmo'

type MeshInfo = { cfgId?: string; basePos: Vector3; dir: Vector3 }

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

// Renderer for single-tint (body) and per-node-tinted GLB models. Auto-fits
// the bounding box, recenters, and explodes sub-meshes radially from the
// model center. Keeps each mesh's original material so embedded textures are
// preserved; tints via material.color.
export function BodyTintedConfigurator({
  colors,
  modelPreset,
  explodeAmount,
  selectionEnabled,
  onDraggingChange,
  selectedPartId,
  onSelectedPartChange,
  colorizeMode = false,
}: Props) {
  const modelPath = import.meta.env.BASE_URL + modelPreset.path
  const { scene: source } = useGLTF(modelPath)
  const scene = useMemo(() => source.clone(true), [source])

  const group = useRef<Group>(null)
  const manualOffsetsRef = useRef<Map<string, Vector3>>(new Map())
  const gl = useThree(state => state.gl)
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl])

  const colorMode = modelPreset.colorMode ?? 'body'

  const { autoFitScale, modelCenter, byUuid } = useMemo(() => {
    const { fit, center, radius } = computeAutoFit(scene)
    const meshes = collectMeshes(scene)
    const radial = computeRadialDirections(meshes, center, radius)

    const idSet = new Set(modelPreset.materials.map(m => m.id))
    const findAncestorId = (obj: THREE.Object3D): string | undefined => {
      let cursor: THREE.Object3D | null = obj
      while (cursor) {
        if (idSet.has(cursor.name)) return cursor.name
        cursor = cursor.parent
      }
      return undefined
    }

    const map = new Map<string, MeshInfo>()
    meshes.forEach(mesh => {
      const cfgId = colorMode === 'per-node' ? findAncestorId(mesh) : modelPreset.materials[0]?.id

      // Clone material per mesh for per-node mode so tinting doesn't bleed
      // across meshes that share a source material.
      if (colorMode === 'per-node') {
        if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(m => m.clone())
        else if (mesh.material) mesh.material = mesh.material.clone()
      }

      upgradeMeshTextures(mesh, maxAnisotropy)

      map.set(mesh.uuid, {
        cfgId,
        basePos: mesh.position.clone(),
        dir: radial.get(mesh.uuid) ?? new Vector3(),
      })
    })

    return { autoFitScale: fit, modelCenter: center, byUuid: map }
  }, [scene, modelPreset, colorMode, maxAnisotropy])

  const resetMesh = useCallback((mesh: THREE.Object3D, info: MeshInfo) => {
    manualOffsetsRef.current.delete(mesh.uuid)
    const scaled = info.dir.clone().multiplyScalar(explodeAmount)
    mesh.position.copy(info.basePos).add(scaled)
  }, [explodeAmount])

  const commitDrag = useCallback((mesh: THREE.Object3D, info: MeshInfo) => {
    const scaled = info.dir.clone().multiplyScalar(explodeAmount)
    const manual = mesh.position.clone().sub(info.basePos).sub(scaled)
    manualOffsetsRef.current.set(mesh.uuid, manual)
  }, [explodeAmount])

  const { hovered, selectedUuid, selectedObject, groupHandlers, transformHandlers } =
    useMeshSelection<MeshInfo>({
      scene,
      byUuid,
      selectionEnabled,
      selectedPartId,
      onSelectedPartChange,
      onDraggingChange,
      onResetMesh: resetMesh,
      onCommitDrag: commitDrag,
    })

  useEffect(() => {
    scene.traverse(child => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const info = byUuid.get(mesh.uuid)
      if (!info) return

      const cfg = modelPreset.materials.find(m => m.id === info.cfgId)
      const hex = cfg ? (colors[cfg.id] || cfg.defaultColor) : '#ffffff'
      const finalColor = new Color(hex)
      const isSelected = mesh.uuid === selectedUuid
      if (hovered) finalColor.multiplyScalar(1.2)
      if (isSelected) finalColor.lerp(new Color('#ffeb3b'), 0.35)

      mesh.castShadow = false
      mesh.receiveShadow = false

      const applyToMat = (mat: THREE.Material | null | undefined) => {
        const m = mat as THREE.MeshStandardMaterial | null
        if (!m || !m.color) return
        m.color.copy(finalColor)
        m.envMapIntensity = hovered ? 1.5 : 1
        if (m.emissive) {
          if (isSelected) {
            m.emissive.setHex(0xffaa00)
            if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 0.35
          } else {
            m.emissive.setHex(0x000000)
            if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 0
          }
        }
        m.needsUpdate = true
      }
      if (Array.isArray(mesh.material)) mesh.material.forEach(applyToMat)
      else applyToMat(mesh.material)

      applyColorizeToMesh(mesh, colorizeMode)

      // TransformControls drives the selected mesh's position directly — don't fight it.
      if (!isSelected) {
        const manual = manualOffsetsRef.current.get(mesh.uuid)
        const scaled = info.dir.clone().multiplyScalar(explodeAmount)
        mesh.position.copy(info.basePos).add(scaled)
        if (manual) mesh.position.add(manual)
      }
    })
  }, [scene, hovered, colors, modelPreset, explodeAmount, byUuid, selectedUuid, colorizeMode])

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
    <>
      <group
        ref={group}
        {...groupHandlers}
        rotation={modelPreset.rotation ?? [0, 0, 0]}
        scale={finalScale}
        position={modelPreset.position ?? [0, 0, 0]}
      >
        <group position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}>
          <primitive object={scene} />
        </group>
      </group>
      <SelectionGizmo object={selectedObject} enabled={selectionEnabled} {...transformHandlers} />
    </>
  )
}
