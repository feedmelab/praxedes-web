'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { uploadFile, deleteFile } from '@/lib/imagekit'
import { isVimeoImageHost } from '@/lib/vimeo'
import { slugify, parseVimeo } from '@/lib/utils'
import type { ProjectCategory } from '@prisma/client'

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('No autorizado')
}

// Refresca las páginas públicas afectadas por un cambio (necesario en
// producción, donde se cachean). Invalidamos todo el árbol con
// revalidatePath('/', 'layout') porque con las rutas localizadas de next-intl
// la invalidación por ruta concreta no siempre casa. Es una web de edición
// poco frecuente, así que el coste es irrelevante y garantiza que la web
// pública muestre los cambios al recargar.
function revalidatePublic() {
  revalidatePath('/', 'layout')
}

const projectSchema = z.object({
  category: z.enum(['COMMERCIALS', 'FILM_TV', 'EDITORIAL']),
  client: z.string().min(1, 'Cliente requerido'),
  year: z.coerce.number().int().min(1950).max(2100),
  titleEs: z.string().min(1, 'Título (ES) requerido'),
  titleEn: z.string().min(1, 'Título (EN) requerido'),
  descEs: z.string().optional(),
  descEn: z.string().optional(),
  vimeoId: z.string().optional(),
})

/* ── Crear ───────────────────────────────────────────────────── */

export async function createProject(formData: FormData) {
  await requireAuth()
  const parsed = projectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  // Slug único a partir de cliente + título
  const base = slugify(`${parsed.data.client}-${parsed.data.titleEs}`)
  let slug = base
  let n = 1
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      category: parsed.data.category as ProjectCategory,
      vimeoId: parsed.data.vimeoId || null,
      descEs: parsed.data.descEs || null,
      descEn: parsed.data.descEn || null,
      slug,
    },
  })

  revalidatePath('/admin/projects')
  revalidatePublic()
  redirect(`/admin/projects/${project.id}`)
}

/* ── Actualizar ──────────────────────────────────────────────── */

export async function updateProject(id: string, formData: FormData) {
  await requireAuth()
  const parsed = projectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  await prisma.project.update({
    where: { id },
    data: {
      ...parsed.data,
      category: parsed.data.category as ProjectCategory,
      vimeoId: parsed.data.vimeoId || null,
      descEs: parsed.data.descEs || null,
      descEn: parsed.data.descEn || null,
    },
  })

  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${id}`)
  revalidatePublic()
  return { ok: true }
}

/* ── Toggles ─────────────────────────────────────────────────── */

export async function togglePublished(id: string, value: boolean) {
  await requireAuth()
  await prisma.project.update({ where: { id }, data: { published: value } })
  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${id}`)
  revalidatePublic()
}

export async function toggleFeatured(id: string, value: boolean) {
  await requireAuth()
  await prisma.project.update({ where: { id }, data: { featured: value } })
  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${id}`)
  revalidatePublic()
}

/* ── Borrar (con limpieza de ImageKit) ───────────────────────── */

export async function deleteProject(id: string) {
  await requireAuth()
  const project = await prisma.project.findUnique({
    where: { id },
    include: { images: true, frames: true },
  })
  if (!project) return

  // Borrar ficheros de ImageKit (best-effort)
  const fileIds = [
    ...project.images.map((i) => i.fileId),
    ...project.frames.map((f) => f.fileId),
  ].filter((fid): fid is string => !!fid)
  await Promise.allSettled(fileIds.map((fid) => deleteFile(fid)))

  await prisma.project.delete({ where: { id } })
  revalidatePath('/admin/projects')
  redirect('/admin/projects')
}

/* ── Imágenes ────────────────────────────────────────────────── */

export async function addProjectImage(projectId: string, formData: FormData) {
  await requireAuth()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Archivo requerido' }

  const buffer = Buffer.from(await file.arrayBuffer())
  const uploaded = await uploadFile(buffer, file.name, `projects/${projectId}`, [projectId])

  const count = await prisma.projectImage.count({ where: { projectId } })
  const image = await prisma.projectImage.create({
    data: {
      projectId,
      kind: 'IMAGE',
      fileId: uploaded.fileId,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      order: count,
    },
  })

  // Primera imagen → portada automática
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (project && !project.coverImage) {
    await prisma.project.update({ where: { id: projectId }, data: { coverImage: image.url } })
  }

  revalidatePath(`/admin/projects/${projectId}`)
  revalidatePublic()
  return { ok: true }
}

/**
 * Guarda como imagen del proyecto una imagen alojada en una URL permitida
 * (p.ej. un fotograma generado por la Pictures API de Vimeo — allowlist
 * anti-SSRF). La descarga, la sube a ImageKit y crea un ProjectImage.
 */
export async function addProjectImageFromUrl(projectId: string, url: string) {
  await requireAuth()
  if (!isVimeoImageHost(url)) return { error: 'URL de imagen no permitida' }

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return { error: `No se pudo descargar la imagen (${res.status})` }
  const buffer = Buffer.from(await res.arrayBuffer())
  const uploaded = await uploadFile(buffer, `frame-${Date.now()}.jpg`, `projects/${projectId}`, [
    projectId,
  ])

  const count = await prisma.projectImage.count({ where: { projectId } })
  const image = await prisma.projectImage.create({
    data: {
      projectId,
      kind: 'IMAGE',
      fileId: uploaded.fileId,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      order: count,
    },
  })
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (project && !project.coverImage) {
    await prisma.project.update({ where: { id: projectId }, data: { coverImage: image.url } })
  }

  revalidatePath(`/admin/projects/${projectId}`)
  revalidatePublic()
  return { ok: true }
}

/** Añade un vídeo de Vimeo como item de la galería del proyecto. */
export async function addProjectVideo(projectId: string, vimeoInput: string) {
  await requireAuth()
  const { id, hash } = parseVimeo(vimeoInput)
  if (!id || !/^\d{6,}$/.test(id)) return { error: 'Introduce un ID o URL de Vimeo válido' }
  const vimeoId = hash ? `${id}?h=${hash}` : id

  const count = await prisma.projectImage.count({ where: { projectId } })
  await prisma.projectImage.create({
    data: { projectId, kind: 'VIDEO', vimeoId, order: count },
  })

  revalidatePath(`/admin/projects/${projectId}`)
  revalidatePublic()
  return { ok: true }
}

export async function deleteProjectImage(imageId: string) {
  await requireAuth()
  const image = await prisma.projectImage.findUnique({ where: { id: imageId } })
  if (!image) return

  if (image.fileId) await Promise.allSettled([deleteFile(image.fileId)])
  await prisma.projectImage.delete({ where: { id: imageId } })

  // Si era la portada, reasignar a otra imagen (solo IMAGE con url)
  const project = await prisma.project.findUnique({ where: { id: image.projectId } })
  if (image.url && project?.coverImage === image.url) {
    const next = await prisma.projectImage.findFirst({
      where: { projectId: image.projectId, kind: 'IMAGE' },
      orderBy: { order: 'asc' },
    })
    await prisma.project.update({
      where: { id: image.projectId },
      data: { coverImage: next?.url ?? null },
    })
  }

  revalidatePath(`/admin/projects/${image.projectId}`)
  revalidatePublic()
}

export async function setCoverImage(projectId: string, url: string) {
  await requireAuth()
  await prisma.project.update({ where: { id: projectId }, data: { coverImage: url } })
  revalidatePath(`/admin/projects/${projectId}`)
  revalidatePublic()
}

// Alterna si un item de la galería ocupa 2 columnas (ancho completo) o 1.
export async function toggleImageWide(imageId: string, value: boolean) {
  await requireAuth()
  const image = await prisma.projectImage.update({
    where: { id: imageId },
    data: { wide: value },
  })
  revalidatePath(`/admin/projects/${image.projectId}`)
  revalidatePublic()
}

/* ── Frames de vídeo ─────────────────────────────────────────── */

export async function addFrame(projectId: string, formData: FormData) {
  await requireAuth()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Archivo requerido' }
  const timecode = Number(formData.get('timecode') ?? 0)

  const buffer = Buffer.from(await file.arrayBuffer())
  const uploaded = await uploadFile(buffer, file.name, `frames/${projectId}`, [projectId, 'frame'])

  const count = await prisma.videoFrame.count({ where: { projectId } })
  await prisma.videoFrame.create({
    data: {
      projectId,
      fileId: uploaded.fileId,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      timecode: Number.isFinite(timecode) ? timecode : 0,
      order: count,
    },
  })

  revalidatePath(`/admin/projects/${projectId}`)
  return { ok: true }
}

/**
 * Guarda como frame una imagen generada por la Pictures API de Vimeo (modo
 * 'thumbnail', para planes sin MP4 progresivo). La URL debe ser de la CDN de
 * Vimeo (allowlist anti-SSRF).
 */
export async function addFrameFromVimeoThumb(projectId: string, timecode: number, url: string) {
  await requireAuth()
  if (!isVimeoImageHost(url)) return { error: 'URL de imagen no permitida' }

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return { error: `No se pudo descargar la imagen (${res.status})` }
  const buffer = Buffer.from(await res.arrayBuffer())

  const uploaded = await uploadFile(
    buffer,
    `vimeo-frame-${timecode.toFixed(2)}.jpg`,
    `frames/${projectId}`,
    [projectId, 'frame']
  )

  const count = await prisma.videoFrame.count({ where: { projectId } })
  await prisma.videoFrame.create({
    data: {
      projectId,
      fileId: uploaded.fileId,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      timecode: Number.isFinite(timecode) ? timecode : 0,
      order: count,
    },
  })

  revalidatePath(`/admin/projects/${projectId}`)
  return { ok: true }
}

export async function deleteFrame(frameId: string) {
  await requireAuth()
  const frame = await prisma.videoFrame.findUnique({ where: { id: frameId } })
  if (!frame) return
  await Promise.allSettled([deleteFile(frame.fileId)])
  await prisma.videoFrame.delete({ where: { id: frameId } })
  revalidatePath(`/admin/projects/${frame.projectId}`)
}

export async function toggleFramePublished(frameId: string, value: boolean) {
  await requireAuth()
  const frame = await prisma.videoFrame.update({
    where: { id: frameId },
    data: { published: value },
  })
  revalidatePath(`/admin/projects/${frame.projectId}`)
  revalidatePublic()
}

/* ── Textos alternativos / metadatos ─────────────────────────── */

export async function updateImageAlt(imageId: string, altEs: string, altEn: string) {
  await requireAuth()
  const image = await prisma.projectImage.update({
    where: { id: imageId },
    data: { altEs: altEs || null, altEn: altEn || null },
  })
  revalidatePath(`/admin/projects/${image.projectId}`)
  revalidatePublic()
}

export async function updateFrameMeta(
  frameId: string,
  data: { timecode: number; labelEs: string; labelEn: string }
) {
  await requireAuth()
  const frame = await prisma.videoFrame.update({
    where: { id: frameId },
    data: {
      timecode: Number.isFinite(data.timecode) ? data.timecode : 0,
      labelEs: data.labelEs || null,
      labelEn: data.labelEn || null,
    },
  })
  revalidatePath(`/admin/projects/${frame.projectId}`)
}

/* ── Reordenación ────────────────────────────────────────────── */

export async function reorderProjects(ids: string[]) {
  await requireAuth()
  await prisma.$transaction(
    ids.map((id, index) => prisma.project.update({ where: { id }, data: { order: index } }))
  )
  revalidatePath('/admin/projects')
}

export async function reorderProjectImages(projectId: string, ids: string[]) {
  await requireAuth()
  await prisma.$transaction(
    ids.map((id, index) => prisma.projectImage.update({ where: { id }, data: { order: index } }))
  )
  revalidatePath(`/admin/projects/${projectId}`)
  revalidatePublic()
}

export async function reorderFrames(projectId: string, ids: string[]) {
  await requireAuth()
  await prisma.$transaction(
    ids.map((id, index) => prisma.videoFrame.update({ where: { id }, data: { order: index } }))
  )
  revalidatePath(`/admin/projects/${projectId}`)
}
