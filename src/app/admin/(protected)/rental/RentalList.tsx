'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '../_components/ui'
import { useSortableList, SortableArea, SortableItem, DragHandle } from '../_components/sortable'
import { reorderRentalItems } from './actions'

export type RentalRow = {
  id: string
  nameEs: string
  meta: string
  available: boolean
}

export default function RentalList({ items }: { items: RentalRow[] }) {
  const [, startTransition] = useTransition()
  const byId = new Map(items.map((i) => [i.id, i]))

  const { ids, sensors, handleDragEnd } = useSortableList(
    items.map((i) => i.id),
    (next) => startTransition(() => reorderRentalItems(next))
  )

  return (
    <SortableArea ids={ids} sensors={sensors} onDragEnd={handleDragEnd}>
      <ul className="overflow-hidden rounded border border-border">
        {ids.map((id) => {
          const item = byId.get(id)
          if (!item) return null
          return (
            <SortableItem key={id} id={id} className="border-b border-border last:border-b-0">
              {(handle) => (
                <div className="flex items-center gap-3 bg-surface px-4 py-4">
                  <DragHandle handle={handle} />
                  <Link
                    href={`/admin/rental/${item.id}`}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-light">{item.nameEs}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">
                        {item.meta}
                      </p>
                    </div>
                    <Badge tone={item.available ? 'green' : 'muted'}>
                      {item.available ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </Link>
                </div>
              )}
            </SortableItem>
          )
        })}
      </ul>
    </SortableArea>
  )
}
