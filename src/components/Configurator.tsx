import { useRef, useState, useEffect, useMemo } from 'react'
import { Group, Color, Vector3, Box3, MeshStandardMaterial } from 'three'
import * as THREE from 'three'
import { useGLTF, useFBX, useTexture, Text } from '@react-three/drei'
import type { ModelPreset } from './ModelSelector'
import type { DynamicColors } from './ColorControls'

interface ConfiguratorProps {
  colors?: DynamicColors
  modelPreset: ModelPreset
  explodeAmount?: number
}

export function Configurator({ colors = {}, modelPreset, explodeAmount = 0 }: ConfiguratorProps) {
  const colorMode = modelPreset.colorMode ?? (modelPreset.loader === 'fbx' ? 'body' : 'per-material')

  if (modelPreset.loader === 'fbx') {
    return <FBXConfigurator colors={colors} modelPreset={modelPreset} explodeAmount={explodeAmount} />
  }
  if (colorMode === 'body' || colorMode === 'per-node') {
    return <GLBBodyConfigurator colors={colors} modelPreset={modelPreset} explodeAmount={explodeAmount} />
  }
  return <GLTFConfigurator colors={colors} modelPreset={modelPreset} explodeAmount={explodeAmount} />
}

// Shared renderer for single-tint models: auto-fits the bounding box, recenters, and
// explodes sub-meshes radially from the model center. Keeps each mesh's original material
// (so embedded GLB textures are preserved) and tints via .color.
function BodyTintedScene({
  scene,
  colors,
  modelPreset,
  explodeAmount,
}: {
  scene: THREE.Object3D
  colors: DynamicColors
  modelPreset: ModelPreset
  explodeAmount: number
}) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  const colorMode = modelPreset.colorMode ?? 'body'

  // Pre-compute for every mesh: its matching material config id, base position, explode offset,
  // and a fresh per-mesh material clone (so per-node tinting doesn't bleed across shared materials).
  const meshData = useMemo(() => {
    // Force world matrices up to date before bounding-box work
    scene.updateMatrixWorld(true)

    const worldBox = new Box3().setFromObject(scene)
    const size = new Vector3()
    worldBox.getSize(size)
    const center = new Vector3()
    worldBox.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const TARGET_SIZE = 1.2
    const fit = TARGET_SIZE / maxDim
    const radius = maxDim * 0.5

    const idSet = new Set(modelPreset.materials.map(m => m.id))
    const findAncestorId = (obj: THREE.Object3D): string | undefined => {
      let cursor: THREE.Object3D | null = obj
      while (cursor) {
        if (idSet.has(cursor.name)) return cursor.name
        cursor = cursor.parent
      }
      return undefined
    }

    type MeshInfo = { cfgId?: string; basePos: Vector3; dir: Vector3 }
    const byUuid = new Map<string, MeshInfo>()
    const meshList: THREE.Object3D[] = []
    scene.traverse((child) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((child as any).isMesh) meshList.push(child)
    })

    meshList.forEach((child, idx) => {
      const meshBox = new Box3().setFromObject(child)
      const meshCenter = new Vector3()
      meshBox.getCenter(meshCenter)
      const dir = meshCenter.clone().sub(center)
      if (dir.lengthSq() < 1e-6) {
        const angle = (idx / Math.max(1, meshList.length)) * Math.PI * 2
        dir.set(Math.cos(angle), 0.3, Math.sin(angle))
      }
      dir.normalize().multiplyScalar(radius)

      // Resolve which preset material this mesh belongs to by walking its ancestor chain.
      // For body mode, everything maps to the first material.
      let cfgId: string | undefined
      if (colorMode === 'per-node') {
        cfgId = findAncestorId(child)
      } else {
        cfgId = modelPreset.materials[0]?.id
      }

      // Clone material per mesh for per-node mode (safe even if already unique in source).
      if (colorMode === 'per-node') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mesh = child as any
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m: THREE.Material) => m.clone())
        } else if (mesh.material) {
          mesh.material = mesh.material.clone()
        }
      }

      byUuid.set(child.uuid, {
        cfgId,
        basePos: child.position.clone(),
        dir,
      })
    })

    // Diagnostic: log what each mesh resolved to (visible in browser devtools)
    // eslint-disable-next-line no-console
    console.log('[Configurator] mesh -> part mapping:', meshList.map(m => ({
      name: m.name,
      parent: m.parent?.name,
      cfgId: byUuid.get(m.uuid)?.cfgId,
    })))

    return { autoFitScale: fit, modelCenter: center, byUuid }
  }, [scene, modelPreset, colorMode])

  const { autoFitScale, modelCenter, byUuid } = meshData

  useEffect(() => {
    if (!scene) return

    scene.traverse((child) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mesh = child as any
      if (!mesh.isMesh) return

      const info = byUuid.get(mesh.uuid)
      if (!info) return

      const cfg = modelPreset.materials.find(m => m.id === info.cfgId)
      const hex = cfg ? (colors[cfg.id] || cfg.defaultColor) : '#ffffff'
      const finalColor = new Color(hex)
      if (hovered) finalColor.multiplyScalar(1.2)

      mesh.castShadow = false
      mesh.receiveShadow = false

      const applyToMat = (mat: THREE.Material | null | undefined) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = mat as any
        if (m && m.color) {
          m.color.copy(finalColor)
          m.envMapIntensity = hovered ? 1.5 : 1
          m.needsUpdate = true
        }
      }
      if (Array.isArray(mesh.material)) mesh.material.forEach(applyToMat)
      else applyToMat(mesh.material)

      const scaled = info.dir.clone().multiplyScalar(explodeAmount)
      mesh.position.copy(info.basePos).add(scaled)
    })
  }, [scene, hovered, colors, modelPreset, explodeAmount, byUuid])

  const presetScale = modelPreset.scale || [1, 1, 1]
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
      rotation={modelPreset.rotation || [0, 0, 0]}
      scale={finalScale}
      position={modelPreset.position || [0, 0, 0]}
    >
      <group position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

function GLBBodyConfigurator({ colors = {}, modelPreset, explodeAmount = 0 }: Required<Pick<ConfiguratorProps, 'modelPreset'>> & ConfiguratorProps) {
  const modelPath = import.meta.env.BASE_URL + modelPreset.path
  const { scene: source } = useGLTF(modelPath)
  const scene = useMemo(() => source.clone(true), [source])

  if (!scene) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="orange">
          Loading model...
        </Text>
      </group>
    )
  }

  return (
    <BodyTintedScene
      scene={scene}
      colors={colors}
      modelPreset={modelPreset}
      explodeAmount={explodeAmount}
    />
  )
}

function GLTFConfigurator({ colors = {}, modelPreset, explodeAmount = 0 }: Required<Pick<ConfiguratorProps, 'modelPreset'>> & ConfiguratorProps) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const previousColorsRef = useRef<DynamicColors>({})
  const previousHoveredRef = useRef<boolean>(false)
  const previousExplodeAmountRef = useRef<number>(0)

  const modelPath = import.meta.env.BASE_URL + modelPreset.path
  const { scene } = useGLTF(modelPath)

  const getExplodeOffset = (materialId: string): [number, number, number] => {
    const explodeMap: Record<string, [number, number, number]> = {
      'frontPlateOutlineColor': [0, 0.2, 0.8],
      'frontPlateLowerMaskColor': [0, -0.5, 0.7],
      'frontPlateSideMasksColor': [0.8, 0, 0.5],
      'frontPlateTouchpadColor': [0, 0.4, 1.2],
      'backPlateColor': [0, 0, -1.0],
      'actionButtonsColor': [0.7, 0.4, 0.8],
      'directionalButtonsColor': [-0.7, 0.4, 0.8],
      'triggersColor': [0, 0.8, 0.3],
      'analogsColor': [0, 0.5, 0.6],
      'optionsShareButtonColor': [0, 0.3, 0.7],
      'psButtonColor': [0, 0.2, 1.5]
    }
    return explodeMap[materialId] || [0, 0, 0]
  }

  useEffect(() => {
    if (!scene || !modelPreset) return

    const colorsChanged = JSON.stringify(colors) !== JSON.stringify(previousColorsRef.current)
    const hoveredChanged = hovered !== previousHoveredRef.current
    const explodeChanged = explodeAmount !== previousExplodeAmountRef.current

    if (!colorsChanged && !hoveredChanged && !explodeChanged) {
      return
    }

    previousColorsRef.current = { ...colors }
    previousHoveredRef.current = hovered
    previousExplodeAmountRef.current = explodeAmount

    scene.traverse((child) => {
      if ('isMesh' in child && child.isMesh && 'material' in child && child.material) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mesh = child as any
          mesh.material.transparent = false
          mesh.material.opacity = 1
          mesh.material.depthWrite = true
          mesh.material.depthTest = true
          mesh.castShadow = true
          mesh.receiveShadow = true

          const materialName = mesh.material.name
          const materialConfig = modelPreset.materials.find(m => m.id === materialName)

          if (materialConfig) {
            const [offsetX, offsetY, offsetZ] = getExplodeOffset(materialConfig.id)
            mesh.position.set(offsetX * explodeAmount, offsetY * explodeAmount, offsetZ * explodeAmount)

            const currentColor = colors[materialConfig.id] || materialConfig.defaultColor
            const finalColor = new Color(currentColor)
            if (hovered) finalColor.multiplyScalar(1.2)
            mesh.material.color.copy(finalColor)

            const isButtonMaterial = materialConfig.id === 'actionButtonsColor' || materialConfig.id === 'directionalButtonsColor'
            const hasBaseTexture = mesh.material.map !== null

            if (isButtonMaterial && hasBaseTexture) {
              mesh.material.transparent = false
              mesh.material.opacity = 1.0
              mesh.material.alphaTest = 0.0
              if (mesh.material.map) {
                mesh.material.map.minFilter = THREE.LinearMipmapLinearFilter
                mesh.material.map.magFilter = THREE.LinearFilter
              }
            } else if (materialConfig.id === 'frontPlateSideMasksColor') {
              mesh.material.transparent = false
              mesh.material.opacity = 1.0
              mesh.material.alphaTest = 0.0
              mesh.material.depthWrite = true
              mesh.material.depthTest = true
              mesh.material.side = THREE.FrontSide
              mesh.material.metalness = 0.2
              mesh.material.roughness = 0.3
              if (mesh.material.emissive) mesh.material.emissive.setHex(0x000000)
              if (mesh.material.emissiveIntensity !== undefined) mesh.material.emissiveIntensity = 0
              mesh.material.toneMapped = true
              mesh.material.vertexColors = false
              mesh.material.color.copy(finalColor)
            } else {
              if (mesh.material.emissiveMap || mesh.material.emissive) {
                mesh.material.emissive.copy(finalColor)
                mesh.material.emissive.multiplyScalar(0.3)
                if (mesh.material.emissiveIntensity !== undefined) mesh.material.emissiveIntensity = 0.3
              }
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
            } else if (materialConfig.id === 'actionButtonsColor' || materialConfig.id === 'directionalButtonsColor') {
              mesh.material.metalness = 0.1
              mesh.material.roughness = 0.9
              mesh.material.transparent = false
              mesh.material.opacity = 1.0
              mesh.material.alphaTest = 0.0
              if (mesh.material.normalMap) mesh.material.normalScale.set(1.2, 1.2)
            } else if (materialConfig.id !== 'frontPlateSideMasksColor') {
              mesh.material.metalness = 0.5
              mesh.material.roughness = 0.2
            }

            mesh.material.envMapIntensity = hovered ? 1.5 : 1
            if (mesh.material.normalMap) mesh.material.normalScale.set(1, 1)
            if (mesh.material.roughnessMap) mesh.material.roughnessMap.encoding = 3000
          } else {
            if (materialName === 'frontPlateOutlineColor') {
              const fixedColor = new Color('#ffffff')
              mesh.material.color.copy(fixedColor)
              const [offsetX, offsetY, offsetZ] = getExplodeOffset('frontPlateOutlineColor')
              mesh.position.set(offsetX * explodeAmount, offsetY * explodeAmount, offsetZ * explodeAmount)
            } else {
              const meshName = child.name || 'unknown'
              let explodeOffset: [number, number, number] = [0, 0, 0]
              if (meshName.includes('front') || meshName.includes('Front')) explodeOffset = [0, 0.1, 0.5]
              else if (meshName.includes('back') || meshName.includes('Back')) explodeOffset = [0, 0, -0.5]
              else if (meshName.includes('button') || meshName.includes('Button')) explodeOffset = [0, 0.3, 0.3]
              mesh.position.set(explodeOffset[0] * explodeAmount, explodeOffset[1] * explodeAmount, explodeOffset[2] * explodeAmount)
            }
            mesh.material.metalness = 0.5
            mesh.material.roughness = 0.2
          }
          mesh.material.needsUpdate = true
        } catch {
          // Silently handle material update errors
        }
      }
    })
  }, [scene, hovered, colors, modelPreset, explodeAmount])

  if (!scene) {
    return (
      <group ref={group}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="orange">
          Loading model...
        </Text>
      </group>
    )
  }

  return (
    <group
      ref={group}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      rotation={modelPreset?.rotation || [0, 0, 0]}
      scale={modelPreset?.scale || [2, 2, 2]}
      position={modelPreset?.position || [0, 0, 0]}
    >
      <primitive object={scene} />
    </group>
  )
}

function FBXConfigurator({ colors = {}, modelPreset, explodeAmount = 0 }: Required<Pick<ConfiguratorProps, 'modelPreset'>> & ConfiguratorProps) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  const modelPath = import.meta.env.BASE_URL + modelPreset.path
  const fbx = useFBX(modelPath)

  // Clone so switching models / swapping materials doesn't mutate the cached original
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
      if (textureUrls[key]) {
        out[key] = loadedTextures[i++]
      }
    }
    return out
  }, [textureUrls, loadedTextures])

  // Auto-fit: compute a scale that normalizes the FBX to a target size regardless of export units.
  // Explode offsets are stored in FBX-local units, sized relative to the model radius so
  // the movement is actually visible after auto-fit scaling is applied by the parent group.
  const { autoFitScale, modelCenter, meshOffsets } = useMemo(() => {
    const offsets = new Map<string, Vector3>()
    const worldBox = new Box3().setFromObject(scene)
    const size = new Vector3()
    worldBox.getSize(size)
    const center = new Vector3()
    worldBox.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const TARGET_SIZE = 1.2
    const fit = TARGET_SIZE / maxDim
    const radius = maxDim * 0.5

    // Count meshes so we can fall back to a spread pattern for single-mesh models
    const meshList: THREE.Object3D[] = []
    scene.traverse((child) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((child as any).isMesh) meshList.push(child)
    })

    meshList.forEach((child, idx) => {
      const meshBox = new Box3().setFromObject(child)
      const meshCenter = new Vector3()
      meshBox.getCenter(meshCenter)
      const dir = meshCenter.clone().sub(center)

      if (dir.lengthSq() < 1e-6) {
        // Single-mesh fallback: fan meshes out along a spiral so the slider still visibly moves things
        const angle = (idx / Math.max(1, meshList.length)) * Math.PI * 2
        dir.set(Math.cos(angle), 0.3, Math.sin(angle))
      }
      dir.normalize().multiplyScalar(radius)
      offsets.set(child.uuid, dir)
    })

    return { autoFitScale: fit, modelCenter: center, meshOffsets: offsets }
  }, [scene])

  useEffect(() => {
    if (!scene) return

    const bodyConfig = modelPreset.materials.find(m => m.id === 'body') ?? modelPreset.materials[0]
    const currentColor = bodyConfig ? (colors[bodyConfig.id] || bodyConfig.defaultColor) : '#ffffff'
    const finalColor = new Color(currentColor)
    if (hovered) finalColor.multiplyScalar(1.2)

    scene.traverse((child) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mesh = child as any
      if (!mesh.isMesh) return

      // Replace FBX material with a fresh MeshStandardMaterial so texture/color binding is clean
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
        if (newMat.map) {
          newMat.map.colorSpace = THREE.SRGBColorSpace
        }
        mesh.material = newMat
        mesh.userData.__configured = true
        mesh.userData.__basePosition = mesh.position.clone()
      }

      // Skip shadow casting on FBX meshes — they're typically very high-poly and shadow-map
      // rendering per light is what kills framerate for these models.
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.material.color.copy(finalColor)
      mesh.material.envMapIntensity = hovered ? 1.5 : 1
      mesh.material.needsUpdate = true

      // Apply explode offset from original rest position
      const basePos: Vector3 = mesh.userData.__basePosition
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
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="orange">
          Loading model...
        </Text>
      </group>
    )
  }

  const presetScale = modelPreset.scale || [1, 1, 1]
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
      rotation={modelPreset.rotation || [0, 0, 0]}
      scale={finalScale}
      position={modelPreset.position || [0, 0, 0]}
    >
      {/* Re-center the model around the origin so auto-fit scaling stays centered */}
      <group position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}>
        <primitive object={scene} />
      </group>
    </group>
  )
}
