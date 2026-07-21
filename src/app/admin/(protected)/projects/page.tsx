import { prisma } from '@/lib/prisma'
import { PageHeader, ButtonLink } from '../_components/ui'
import { PROJECT_CATEGORIES } from './labels'
import ProjectList from './ProjectList'

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
        <>
          <p className="mb-3 text-[11px] text-muted">Arrastra para reordenar.</p>
          <ProjectList
            projects={projects.map((p) => ({
              id: p.id,
              titleEs: p.titleEs,
              meta: `${p.client} · ${p.year} · ${PROJECT_CATEGORIES[p.category]}`,
              published: p.published,
              featured: p.featured,
              counts: `${p._count.images} img · ${p._count.frames} frames`,
            }))}
          />
        </>
      )}
    </div>
  )
}
