'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '../_components/ui'
import { useSortableList, SortableArea, SortableItem, DragHandle } from '../_components/sortable'
import { reorderProjects } from './actions'

export type ProjectRow = {
  id: string
  titleEs: string
  meta: string
  published: boolean
  featured: boolean
  counts: string
}

export default function ProjectList({ projects }: { projects: ProjectRow[] }) {
  const [, startTransition] = useTransition()
  const byId = new Map(projects.map((p) => [p.id, p]))

  const { ids, sensors, handleDragEnd } = useSortableList(
    projects.map((p) => p.id),
    (next) => startTransition(() => reorderProjects(next))
  )

  return (
    <SortableArea ids={ids} sensors={sensors} onDragEnd={handleDragEnd}>
      <ul className="overflow-hidden rounded border border-border">
        {ids.map((id) => {
          const p = byId.get(id)
          if (!p) return null
          return (
            <SortableItem key={id} id={id} className="border-b border-border last:border-b-0">
              {(handle) => (
                <div className="flex items-center gap-3 bg-surface px-4 py-4">
                  <DragHandle handle={handle} />
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-light">{p.titleEs}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">
                        {p.meta}
                      </p>
                    </div>
                    <span className="hidden text-[11px] text-muted sm:block">{p.counts}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      {p.featured && <Badge tone="accent">Destacado</Badge>}
                      <Badge tone={p.published ? 'green' : 'muted'}>
                        {p.published ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </div>
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
