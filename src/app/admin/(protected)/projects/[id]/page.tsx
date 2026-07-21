import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getThumbUrl } from '@/lib/imagekit'
import { PageHeader, Card } from '../../_components/ui'
import ProjectForm from '../ProjectForm'
import ProjectActions from './ProjectActions'
import ImageManager from './ImageManager'
import FrameManager from './FrameManager'
import { updateProject } from '../actions'

export const metadata = { title: 'Editar proyecto' }

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      frames: { orderBy: { order: 'asc' } },
    },
  })
  if (!project) notFound()

  async function action(_prev: { error?: string; ok?: boolean } | null, fd: FormData) {
    'use server'
    return updateProject(id, fd)
  }

  const images = project.images.map((img) => ({
    id: img.id,
    url: img.url,
    thumb: getThumbUrl(img.url, 400),
    isCover: project.coverImage === img.url,
    altEs: img.altEs ?? '',
    altEn: img.altEn ?? '',
  }))

  const frames = project.frames.map((f) => ({
    id: f.id,
    thumb: getThumbUrl(f.url, 400),
    timecode: f.timecode,
    published: f.published,
    labelEs: f.labelEs ?? '',
    labelEn: f.labelEn ?? '',
  }))

  const previewUrl = `/es/proyectos/${project.slug}`

  return (
    <div className="space-y-10">
      <PageHeader title={project.titleEs} back={{ href: '/admin/projects', label: 'Proyectos' }}>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-accent"
        >
          Vista previa ↗
        </a>
        <ProjectActions id={project.id} published={project.published} featured={project.featured} />
      </PageHeader>

      <Card>
        <h2 className="mb-6 text-[11px] uppercase tracking-[0.2em] text-muted">Datos</h2>
        <ProjectForm
          action={action}
          submitLabel="Guardar cambios"
          defaults={{
            category: project.category,
            client: project.client,
            year: project.year,
            titleEs: project.titleEs,
            titleEn: project.titleEn,
            descEs: project.descEs,
            descEn: project.descEn,
            vimeoId: project.vimeoId,
          }}
        />
      </Card>

      <Card>
        <h2 className="mb-6 text-[11px] uppercase tracking-[0.2em] text-muted">
          Imágenes ({images.length})
        </h2>
        <ImageManager projectId={project.id} images={images} />
      </Card>

      <Card>
        <h2 className="mb-6 text-[11px] uppercase tracking-[0.2em] text-muted">
          Frames de vídeo ({frames.length})
        </h2>
        <FrameManager projectId={project.id} frames={frames} />
      </Card>
    </div>
  )
}
