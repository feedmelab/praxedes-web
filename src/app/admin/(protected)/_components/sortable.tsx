'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/** Estado local de orden sincronizado con las props del servidor. */
export function useSortableList(initialIds: string[], onReorder: (ids: string[]) => void) {
  const [ids, setIds] = useState(initialIds)
  const key = initialIds.join(',')

  // Re-sincroniza cuando el servidor devuelve un orden distinto (p. ej. tras
  // añadir o borrar un elemento).
  useEffect(() => {
    setIds(initialIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(ids, oldIndex, newIndex)
    setIds(next)
    onReorder(next)
  }

  return { ids, sensors, handleDragEnd }
}

export function SortableArea({
  ids,
  sensors,
  onDragEnd,
  children,
}: {
  ids: string[]
  sensors: ReturnType<typeof useSensors>
  onDragEnd: (event: DragEndEvent) => void
  children: React.ReactNode
}) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids}>{children}</SortableContext>
    </DndContext>
  )
}

type HandleProps = {
  attributes: React.HTMLAttributes<HTMLElement>
  listeners: Record<string, unknown> | undefined
}

/** Un elemento arrastrable. El `children` recibe las props del asa (handle). */
export function SortableItem({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: (handle: HandleProps) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children({ attributes, listeners })}
    </div>
  )
}

/** Icono de asa reutilizable (⠿). */
export function DragHandle({ handle }: { handle: HandleProps }) {
  return (
    <button
      type="button"
      {...handle.attributes}
      {...handle.listeners}
      className="cursor-grab touch-none text-muted transition-colors hover:text-light active:cursor-grabbing"
      aria-label="Reordenar"
    >
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <circle cx="7" cy="4" r="1.5" />
        <circle cx="13" cy="4" r="1.5" />
        <circle cx="7" cy="10" r="1.5" />
        <circle cx="13" cy="10" r="1.5" />
        <circle cx="7" cy="16" r="1.5" />
        <circle cx="13" cy="16" r="1.5" />
      </svg>
    </button>
  )
}
