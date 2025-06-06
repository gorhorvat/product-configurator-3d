import { useRef, useState, useEffect } from 'react'
import { Group, Color } from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Text } from '@react-three/drei'
import type { ModelPreset } from './ModelSelector'
import type { DynamicColors } from './ColorControls'

interface ConfiguratorProps {
  colors?: DynamicColors
  modelPreset?: ModelPreset
}

export function Configurator({ colors = {}, modelPreset }: ConfiguratorProps) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  
  // Use model preset path if provided, otherwise use default PS5 controller
  const modelPath = modelPreset 
    ? import.meta.env.BASE_URL + modelPreset.path
    : import.meta.env.BASE_URL + 'models/playstation_5_dualsense/scene.gltf'
  
  const { scene } = useGLTF(modelPath)

  // Handle model rotation
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.2
    }
  })
  
  // Update materials when colors change or on hover
  useEffect(() => {
    if (!scene || !modelPreset) return
    
    scene.traverse((child) => {
      // Type guard to check if object is a mesh with material
      if ('isMesh' in child && child.isMesh && 'material' in child && child.material) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mesh = child as any
          
          // Fix transparency and depth issues
          mesh.material.transparent = false
          mesh.material.opacity = 1
          mesh.material.depthWrite = true
          mesh.material.depthTest = true

          // Enable shadows
          mesh.castShadow = true
          mesh.receiveShadow = true

          // Find matching material configuration
          const materialName = mesh.material.name
          const materialConfig = modelPreset.materials.find(m => m.id === materialName)
          
          if (materialConfig) {
            // Use the color from colors prop, or fall back to default
            const currentColor = colors[materialConfig.id] || materialConfig.defaultColor
            const finalColor = new Color(currentColor)
            
            // Apply hover effect
            if (hovered) {
              finalColor.multiplyScalar(1.2)
            }
            
            // Update the material color
            mesh.material.color.copy(finalColor)

            // Apply material properties based on material type
            if (materialConfig.id === 'glass') {
              // Special handling for glass materials
              mesh.material.transparent = true
              mesh.material.opacity = 0.8
              mesh.material.metalness = 0.9
              mesh.material.roughness = 0.1
            } else {
              // Standard material properties
              mesh.material.metalness = 0.5
              mesh.material.roughness = 0.2
            }
            
            mesh.material.envMapIntensity = hovered ? 1.5 : 1

            // Handle texture maps if they exist
            if (mesh.material.normalMap) {
              mesh.material.normalScale.set(1, 1)
            }
            if (mesh.material.roughnessMap) {
              mesh.material.roughnessMap.encoding = 3000 // sRGBEncoding
            }
          }

          mesh.material.needsUpdate = true
        } catch (error) {
          console.error(`Error updating material for mesh: ${child.name}`, error)
        }
      }
    })
  }, [scene, hovered, colors, modelPreset])

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
      rotation={modelPreset?.rotation || [0.2, 0, 0]}
      scale={modelPreset?.scale || [2, 2, 2]}
      position={modelPreset?.position || [0, 0, 0]}
    >
      <primitive object={scene} />
    </group>
  )
}