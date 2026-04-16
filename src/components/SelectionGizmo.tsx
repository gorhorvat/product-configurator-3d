import { TransformControls } from '@react-three/drei'
import type * as THREE from 'three'

interface SelectionGizmoProps {
  object: THREE.Object3D | null
  enabled: boolean
  onMouseDown: () => void
  onMouseUp: () => void
}

export function SelectionGizmo({ object, enabled, onMouseDown, onMouseUp }: SelectionGizmoProps) {
  if (!enabled || !object) return null
  return (
    <TransformControls
      object={object}
      mode="translate"
      size={0.75}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    />
  )
}
