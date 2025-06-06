import { useRef, useState, useEffect } from 'react'
import { Group, Color } from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Text } from '@react-three/drei'

// Define material IDs for different parts
const MATERIAL_IDS = {
  BUTTONS: '1001',      // Main buttons and D-pad
  BACK_PLATE: '1002',   // Controller back plate
  FRONT_PLATE: '1011'   // Front plate and light bar
} as const

type MaterialKey = keyof typeof MATERIAL_IDS
export type Colors = Record<MaterialKey, string>

interface ConfiguratorProps {
  colors?: Partial<Colors>
}

// Default colors
const DEFAULT_COLORS: Colors = {
  BACK_PLATE: '#ffffff',
  BUTTONS: '#303030',
  FRONT_PLATE: '#ffffff'
}

export function Configurator({ colors = DEFAULT_COLORS }: ConfiguratorProps) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)  // Load the 3D model with correct base path for GitHub Pages
  const modelPath = import.meta.env.BASE_URL + 'models/playstation_5_dualsense/scene.gltf'
  const { scene } = useGLTF(modelPath)

  // Handle model rotation
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.2
    }
  })
  // Update materials when colors change or on hover
  useEffect(() => {
    if (!scene) return
    
    // Optimized material detection function
    const getMaterialPart = (materialName: string): MaterialKey | null => {
      const lowerName = materialName.toLowerCase()
      
      // Check for specific material IDs using the constant
      if (lowerName.includes(MATERIAL_IDS.FRONT_PLATE)) return 'FRONT_PLATE'
      if (lowerName.includes(MATERIAL_IDS.BACK_PLATE)) return 'BACK_PLATE'
      if (lowerName.includes(MATERIAL_IDS.BUTTONS)) return 'BUTTONS'
      
      return null
    }
    
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

          // Find which part this mesh belongs to
          const materialName = mesh.material.name
          const partKey = getMaterialPart(materialName)

          if (partKey) {
            // Update color when colors prop changes
            const currentColor = colors[partKey] || DEFAULT_COLORS[partKey]
            const newColor = new Color(currentColor)
            
            // Apply hover effect
            if (hovered) {
              newColor.multiplyScalar(1.2)
            }
            
            // Update the material color
            mesh.material.color.copy(newColor)

            // Apply material properties
            mesh.material.metalness = 0.5
            mesh.material.roughness = 0.2
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
  }, [scene, hovered, colors])

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
      rotation={[0.2, 0, 0]}
      scale={[2, 2, 2]}
    >
      <primitive object={scene} />
    </group>
  )
}