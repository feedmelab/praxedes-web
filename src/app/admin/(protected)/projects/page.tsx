import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader, ButtonLink, Badge } from '../_components/ui'
import { PROJECT_CATEGORIES } from './labels'

export const metadata = { title: 'Proyectos' }

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { images: true, frames: true } } },
  })

  return (
    <div>
      <PageHeader title="Proyectos">
        <ButtonLink href="/admin/projects/new" variant="solid">
          + Nuevo
        </ButtonLink>
      </PageHeader>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay proyectos. Crea el primero.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded border border-border">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/projects/${p.id}`}
                className="flex items-center gap-4 bg-surface px-5 py-4 transition-colors hover:bg-border/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-light">{p.titleEs}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">
                    {p.client} · {p.year} · {PROJECT_CATEGORIES[p.category]}
                  </p>
                </div>
                <span className="hidden text-[11px] text-muted sm:block">
                  {p._count.images} img · {p._count.frames} frames
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {p.featured && <Badge tone="accent">Destacado</Badge>}
                  <Badge tone={p.published ? 'green' : 'muted'}>
                    {p.published ? 'Publicado' : 'Borrador'}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
