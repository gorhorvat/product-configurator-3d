import { useRef, useState, useEffect } from 'react'
import { Group, Color } from 'three'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { Text } from '@react-three/drei'
import type { ModelPreset } from './ModelSelector'
import type { DynamicColors } from './ColorControls'

interface ConfiguratorProps {
  colors?: DynamicColors
  modelPreset?: ModelPreset
  explodeAmount?: number
}

export function Configurator({ colors = {}, modelPreset, explodeAmount = 0 }: ConfiguratorProps) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const previousColorsRef = useRef<DynamicColors>({})
  const previousHoveredRef = useRef<boolean>(false)
  const previousExplodeAmountRef = useRef<number>(0)
  
  // Use model preset path if provided, otherwise use default PS5 controller
  const modelPath = modelPreset 
    ? import.meta.env.BASE_URL + modelPreset.path
    : import.meta.env.BASE_URL + 'models/playstation_5_dualsense/dualsense_controller.gltf'
  
  const { scene } = useGLTF(modelPath)

  // Define explode offsets for different material types
  const getExplodeOffset = (materialId: string): [number, number, number] => {
    const explodeMap: Record<string, [number, number, number]> = {
      // Front plate components
      'frontPlateOutlineColor': [0, 0.2, 0.8],
      'frontPlateLowerMaskColor': [0, -0.5, 0.7],
      'frontPlateSideMasksColor': [0.8, 0, 0.5],
      'frontPlateTouchpadColor': [0, 0.4, 1.2],
      
      // Main body
      'backPlateColor': [0, 0, -1.0],
      
      // Buttons and controls
      'actionButtonsColor': [0.7, 0.4, 0.8],
      'directionalButtonsColor': [-0.7, 0.4, 0.8],
      'triggersColor': [0, 0.8, 0.3],
      'analogsColor': [0, 0.5, 0.6],
      'optionsShareButtonColor': [0, 0.3, 0.7],
      'psButtonColor': [0, 0.2, 1.5]
    }
    
    return explodeMap[materialId] || [0, 0, 0]
  }  // Update materials when colors change or on hover
  useEffect(() => {
    if (!scene || !modelPreset) return

    // Check if colors actually changed to prevent unnecessary updates
    const colorsChanged = JSON.stringify(colors) !== JSON.stringify(previousColorsRef.current)
    const hoveredChanged = hovered !== previousHoveredRef.current
    const explodeChanged = explodeAmount !== previousExplodeAmountRef.current
    
    if (!colorsChanged && !hoveredChanged && !explodeChanged) {
      return // Skip update if nothing meaningful changed
    }

    // Update refs
    previousColorsRef.current = { ...colors }
    previousHoveredRef.current = hovered
    previousExplodeAmountRef.current = explodeAmount

    scene.traverse((child) => {
      // Type guard to check if object is a mesh with material
      if ('isMesh' in child && child.isMesh && 'material' in child && child.material) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mesh = child as any
          
          // Fix transparency and depth issues FIRST
          mesh.material.transparent = false
          mesh.material.opacity = 1
          mesh.material.depthWrite = true
          mesh.material.depthTest = true

          // Enable shadows
          mesh.castShadow = true
          mesh.receiveShadow = true          // Find matching material configuration
          const materialName = mesh.material.name
          const materialConfig = modelPreset.materials.find(m => m.id === materialName)
          
          if (materialConfig) {
            // Apply explode positioning
            const [offsetX, offsetY, offsetZ] = getExplodeOffset(materialConfig.id)
            mesh.position.set(
              offsetX * explodeAmount,
              offsetY * explodeAmount,
              offsetZ * explodeAmount
            )

            // Use the color from colors prop, or fall back to default
            const currentColor = colors[materialConfig.id] || materialConfig.defaultColor
            const finalColor = new Color(currentColor)
            
            // Apply hover effect
            if (hovered) {
              finalColor.multiplyScalar(1.2)
            }

            // Set base color immediately
            mesh.material.color.copy(finalColor)

            // Handle special material cases
            const isButtonMaterial = materialConfig.id === 'actionButtonsColor' || materialConfig.id === 'directionalButtonsColor'
            const hasBaseTexture = mesh.material.map !== null
            
            if (isButtonMaterial && hasBaseTexture) {
              // For button materials with textures, handle transparency properly
              mesh.material.transparent = false
              mesh.material.opacity = 1.0
              mesh.material.alphaTest = 0.0
              
              if (mesh.material.map) {
                mesh.material.map.minFilter = THREE.LinearMipmapLinearFilter
                mesh.material.map.magFilter = THREE.LinearFilter
              }            } else if (materialConfig.id === 'frontPlateSideMasksColor') {
              // Special handling for front plate sides - be very explicit and stable
              
              // Set all properties in a specific order to prevent conflicts
              mesh.material.transparent = false
              mesh.material.opacity = 1.0
              mesh.material.alphaTest = 0.0
              mesh.material.depthWrite = true
              mesh.material.depthTest = true
              mesh.material.side = THREE.FrontSide
              
              // Material properties
              mesh.material.metalness = 0.2
              mesh.material.roughness = 0.3
              
              // Disable emissive properties that might cause flickering
              if (mesh.material.emissive) {
                mesh.material.emissive.setHex(0x000000)
              }
              if (mesh.material.emissiveIntensity !== undefined) {
                mesh.material.emissiveIntensity = 0
              }
              
              // Force disable any animation or dynamic properties
              mesh.material.toneMapped = true
              mesh.material.vertexColors = false
              
              // Ensure color is set last and only once per update
              mesh.material.color.copy(finalColor)
            } else {
              // Handle emissive materials for other components
              if (mesh.material.emissiveMap || mesh.material.emissive) {
                mesh.material.emissive.copy(finalColor)
                mesh.material.emissive.multiplyScalar(0.3)
                
                if (mesh.material.emissiveIntensity !== undefined) {
                  mesh.material.emissiveIntensity = 0.3
                }
              }
            }

            // Apply remaining material properties based on material type
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
              
              if (mesh.material.normalMap) {
                mesh.material.normalScale.set(1.2, 1.2)
              }
            } else if (materialConfig.id !== 'frontPlateSideMasksColor') {
              // Default properties for other materials (skip front plate sides as we handled it above)
              mesh.material.metalness = 0.5
              mesh.material.roughness = 0.2
            }
            
            mesh.material.envMapIntensity = hovered ? 1.5 : 1

            if (mesh.material.normalMap) {
              mesh.material.normalScale.set(1, 1)
            }
            if (mesh.material.roughnessMap) {
              mesh.material.roughnessMap.encoding = 3000
            }
          } else {
            // Handle unmapped materials
            if (materialName === 'frontPlateOutlineColor') {
              const fixedColor = new Color('#ffffff')
              mesh.material.color.copy(fixedColor)
              
              const [offsetX, offsetY, offsetZ] = getExplodeOffset('frontPlateOutlineColor')
              mesh.position.set(
                offsetX * explodeAmount,
                offsetY * explodeAmount,
                offsetZ * explodeAmount
              )
            } else {
              const meshName = child.name || 'unknown'
              
              let explodeOffset: [number, number, number] = [0, 0, 0]
              if (meshName.includes('front') || meshName.includes('Front')) {
                explodeOffset = [0, 0.1, 0.5]
              } else if (meshName.includes('back') || meshName.includes('Back')) {
                explodeOffset = [0, 0, -0.5]
              } else if (meshName.includes('button') || meshName.includes('Button')) {
                explodeOffset = [0, 0.3, 0.3]
              }
              
              mesh.position.set(
                explodeOffset[0] * explodeAmount,
                explodeOffset[1] * explodeAmount,
                explodeOffset[2] * explodeAmount
              )
            }
            
            mesh.material.metalness = 0.5
            mesh.material.roughness = 0.2
          }          mesh.material.needsUpdate = true
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