import { prisma } from '@/lib/prisma'
import { signedDisplayUrl } from '@/lib/imagekit'
import type { ProjectCategory, RentalCategory, ReservationStatus } from '@prisma/client'

import type { Focal } from '@/lib/focal'

export type RentalImage = {
  fileId: string
  url: string
  width: number
  height: number
  focal?: Focal
}

// Firma la portada de un proyecto (URLs de ImageKit); deja intactas las demo.
function signCover<T extends { coverImage: string | null }>(p: T): T {
  return p.coverImage ? { ...p, coverImage: signedDisplayUrl(p.coverImage) } : p
}

// Etiquetas de categoría por idioma para la web pública.
export const CATEGORY_LABELS: Record<'es' | 'en', Record<ProjectCategory, string>> = {
  es: { COMMERCIALS: 'Publicidad', FILM_TV: 'Cine y TV', EDITORIAL: 'Editorial' },
  en: { COMMERCIALS: 'Commercials', FILM_TV: 'Film & TV', EDITORIAL: 'Editorial' },
}

export type Locale = 'es' | 'en'

/** Ajustes del sitio (singleton). Devuelve null si aún no existen. */
export async function getSettings() {
  try {
    return await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
  } catch {
    return null
  }
}

/** Proyectos destacados y publicados, ordenados. */
export async function getFeaturedProjects() {
  try {
    const rows = await prisma.project.findMany({
      where: { published: true, featured: true },
      orderBy: { order: 'asc' },
      take: 6,
    })
    return rows.map(signCover)
  } catch {
    return []
  }
}

/** Proyectos publicados de una categoría, ordenados. */
export async function getProjectsByCategory(category: ProjectCategory) {
  try {
    const rows = await prisma.project.findMany({
      where: { published: true, category },
      orderBy: { order: 'asc' },
    })
    return rows.map(signCover)
  } catch {
    return []
  }
}

/** Nombres de cliente distintos de los proyectos publicados, en orden. */
export async function getClients(): Promise<string[]> {
  try {
    const rows = await prisma.project.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: { client: true },
    })
    const seen = new Set<string>()
    const out: string[] = []
    for (const r of rows) {
      const c = r.client?.trim()
      if (c && !seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase())
        out.push(c)
      }
    }
    return out
  } catch {
    return []
  }
}

/** Slugs publicados (para generateStaticParams). */
export async function getPublishedSlugs() {
  try {
    const rows = await prisma.project.findMany({
      where: { published: true },
      select: { slug: true },
    })
    return rows.map((r) => r.slug)
  } catch {
    return []
  }
}

/** Ficha de proyecto: proyecto + galería (imágenes/vídeos), URLs firmadas. */
export async function getProjectBySlug(slug: string) {
  try {
    const project = await prisma.project.findFirst({
      where: { slug, published: true },
      include: { images: { orderBy: { order: 'asc' } } },
    })
    if (!project) return null
    return {
      ...signCover(project),
      images: project.images.map((m) => ({
        id: m.id,
        kind: m.kind as 'IMAGE' | 'VIDEO',
        url: m.url ? signedDisplayUrl(m.url) : null,
        vimeoId: m.vimeoId,
        wide: m.wide,
        focal: m.focal,
        altEs: m.altEs,
        altEn: m.altEn,
      })),
    }
  } catch {
    return null
  }
}

/** Título / descripción del proyecto según idioma. */
export function localizedTitle(p: { titleEs: string; titleEn: string }, locale: Locale) {
  return locale === 'en' ? p.titleEn : p.titleEs
}

export function localizedDesc(p: { descEs: string | null; descEn: string | null }, locale: Locale) {
  return locale === 'en' ? p.descEn : p.descEs
}

// Reservas que restan disponibilidad: confirmadas y también las pendientes de
// confirmar (retienen stock mientras el admin decide, para no sobrevender).
const ACTIVE_STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED']
const activeReservations = {
  where: { status: { in: ACTIVE_STATUSES } },
  select: { startDate: true, endDate: true, quantity: true },
}

/** Piezas de alquiler disponibles, ordenadas, con sus reservas confirmadas. */
export async function getRentalItems() {
  try {
    return await prisma.rentalItem.findMany({
      where: { available: true },
      orderBy: { order: 'asc' },
      include: { reservations: activeReservations },
    })
  } catch {
    return []
  }
}

/** Una pieza de alquiler disponible por id, con sus reservas confirmadas. */
export async function getRentalItem(id: string) {
  try {
    return await prisma.rentalItem.findFirst({
      where: { id, available: true },
      include: { reservations: activeReservations },
    })
  } catch {
    return null
  }
}

/** IDs de piezas disponibles (para generateStaticParams). */
export async function getRentalItemIds() {
  try {
    const rows = await prisma.rentalItem.findMany({
      where: { available: true },
      select: { id: true },
    })
    return rows.map((r) => r.id)
  } catch {
    return []
  }
}

export const RENTAL_LABELS: Record<'es' | 'en', Record<RentalCategory, string>> = {
  es: {
    PERIOD: 'Época',
    CONTEMPORARY: 'Contemporáneo',
    ACCESSORIES: 'Accesorios',
    PROPS: 'Atrezo',
    OTHER: 'Otros',
  },
  en: {
    PERIOD: 'Period',
    CONTEMPORARY: 'Contemporary',
    ACCESSORIES: 'Accessories',
    PROPS: 'Props',
    OTHER: 'Other',
  },
}
