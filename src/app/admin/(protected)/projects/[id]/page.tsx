import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getThumbUrl } from '@/lib/imagekit'
import { PageHeader, Card } from '../../_components/ui'
import ProjectForm from '../ProjectForm'
import ProjectActions from './ProjectActions'
import ImageManager from './ImageManager'
import VimeoCapture from './VimeoCapture'
import { updateProject } from '../actions'

export const metadata = { title: 'Editar proyecto' }

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  })
  if (!project) notFound()

  async function action(_prev: { error?: string; ok?: boolean } | null, fd: FormData) {
    'use server'
    return updateProject(id, fd)
  }

  // Galería unificada: cada item es una imagen (foto subida o fotograma
  // extraído) o un vídeo de Vimeo.
  const media = project.images.map((m) => ({
    id: m.id,
    kind: m.kind as 'IMAGE' | 'VIDEO',
    url: m.url ?? '',
    thumb: m.url ? getThumbUrl(m.url, 400) : '',
    vimeoId: m.vimeoId ?? '',
    isCover: !!m.url && project.coverImage === m.url,
    altEs: m.altEs ?? '',
    altEn: m.altEn ?? '',
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
        <h2 className="mb-1 text-[11px] uppercase tracking-[0.2em] text-muted">
          Galería ({media.length})
        </h2>
        <p className="mb-6 text-[11px] text-muted">
          Sube fotos, añade vídeos de Vimeo, y ordena todo. Las imágenes extraídas del vídeo (abajo)
          también aparecen aquí como una foto más.
        </p>
        <ImageManager projectId={project.id} images={media} />
      </Card>

      <Card>
        <h2 className="mb-1 text-[11px] uppercase tracking-[0.2em] text-muted">
          Extraer fotogramas del vídeo
        </h2>
        <p className="mb-6 text-[11px] text-muted">
          Captura un fotograma del vídeo y se añade a la galería como una imagen (luego la colocas
          donde quieras). No se muestra como “frame” en la web.
        </p>
        {project.vimeoId ? (
          <VimeoCapture projectId={project.id} vimeoId={project.vimeoId} />
        ) : (
          <p className="text-[11px] text-muted">
            Añade un vídeo de Vimeo en los datos del proyecto para poder extraer fotogramas.
          </p>
        )}
      </Card>
    </div>
  )
}
