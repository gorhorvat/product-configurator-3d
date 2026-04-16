import { useCallback, useEffect, useMemo, useState } from 'react'
import type * as THREE from 'three'

export type MeshInfoBase = { cfgId?: string }

interface Options<Info extends MeshInfoBase> {
  scene: THREE.Object3D
  byUuid: Map<string, Info>
  selectionEnabled: boolean
  selectedPartId: string | null
  onSelectedPartChange?: (id: string | null) => void
  onDraggingChange?: (dragging: boolean) => void
  // Right-click: clear manual offset + snap back to explode-driven position.
  onResetMesh?: (mesh: THREE.Object3D, info: Info) => void
  // Mouse-up on gizmo: persist the drag delta so the effect loop doesn't overwrite it.
  onCommitDrag?: (mesh: THREE.Object3D, info: Info) => void
}

// Shared selection + gizmo machinery for GLTF configurators. Owns the
// selectedUuid state, two-way sync with the parent's cfgId-based selection,
// and the group/transform event handlers. Per-configurator concerns (base
// positions, explode math) are injected via onResetMesh / onCommitDrag.
export function useMeshSelection<Info extends MeshInfoBase>({
  scene,
  byUuid,
  selectionEnabled,
  selectedPartId,
  onSelectedPartChange,
  onDraggingChange,
  onResetMesh,
  onCommitDrag,
}: Options<Info>) {
  const [hovered, setHovered] = useState(false)
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null)

  useEffect(() => {
    if (!selectionEnabled) setSelectedUuid(null)
  }, [selectionEnabled])

  // External selectedPartId -> local selectedUuid. If the current selection
  // already maps to the same cfgId we leave it alone (preserves which specific
  // mesh the user picked when multiple meshes share a cfgId).
  useEffect(() => {
    if (!selectedPartId) {
      setSelectedUuid(null)
      return
    }
    const current = selectedUuid ? byUuid.get(selectedUuid) : null
    if (current?.cfgId === selectedPartId) return
    let target: string | null = null
    for (const [uuid, info] of byUuid.entries()) {
      if (info.cfgId === selectedPartId) { target = uuid; break }
    }
    setSelectedUuid(target)
    // intentionally exclude selectedUuid: only react to external changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartId, byUuid])

  useEffect(() => {
    const info = selectedUuid ? byUuid.get(selectedUuid) : null
    onSelectedPartChange?.(info?.cfgId ?? null)
  }, [selectedUuid, byUuid, onSelectedPartChange])

  const selectedObject = useMemo<THREE.Object3D | null>(() => {
    if (!selectedUuid) return null
    let found: THREE.Object3D | null = null
    scene.traverse(child => { if (!found && child.uuid === selectedUuid) found = child })
    return found
  }, [selectedUuid, scene])

  const handleClick = useCallback((e: { object: THREE.Object3D; stopPropagation: () => void }) => {
    if (!selectionEnabled) return
    e.stopPropagation()
    let cursor: THREE.Object3D | null = e.object
    while (cursor) {
      if ((cursor as THREE.Mesh).isMesh && byUuid.has(cursor.uuid)) {
        setSelectedUuid(cursor.uuid)
        return
      }
      cursor = cursor.parent
    }
  }, [selectionEnabled, byUuid])

  const handlePointerMissed = useCallback(() => {
    if (selectionEnabled) setSelectedUuid(null)
  }, [selectionEnabled])

  const handleContextMenu = useCallback((e: { object: THREE.Object3D; stopPropagation: () => void; nativeEvent: MouseEvent }) => {
    if (!selectionEnabled) return
    let cursor: THREE.Object3D | null = e.object
    while (cursor) {
      if ((cursor as THREE.Mesh).isMesh && byUuid.has(cursor.uuid)) {
        e.stopPropagation()
        e.nativeEvent.preventDefault()
        const info = byUuid.get(cursor.uuid)!
        onResetMesh?.(cursor, info)
        return
      }
      cursor = cursor.parent
    }
  }, [selectionEnabled, byUuid, onResetMesh])

  const handleTransformMouseDown = useCallback(() => {
    onDraggingChange?.(true)
  }, [onDraggingChange])

  const handleTransformMouseUp = useCallback(() => {
    if (selectedObject) {
      const info = byUuid.get(selectedObject.uuid)
      if (info) onCommitDrag?.(selectedObject, info)
    }
    onDraggingChange?.(false)
  }, [selectedObject, byUuid, onCommitDrag, onDraggingChange])

  return {
    hovered,
    selectedUuid,
    selectedObject,
    groupHandlers: {
      onPointerOver: () => setHovered(true),
      onPointerOut: () => setHovered(false),
      onClick: handleClick,
      onContextMenu: handleContextMenu,
      onPointerMissed: handlePointerMissed,
    },
    transformHandlers: {
      onMouseDown: handleTransformMouseDown,
      onMouseUp: handleTransformMouseUp,
    },
  }
}
