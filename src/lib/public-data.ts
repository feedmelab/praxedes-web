import { prisma } from '@/lib/prisma'
import { signedDisplayUrl } from '@/lib/imagekit'
import type { ProjectCategory, RentalCategory } from '@prisma/client'

export type RentalImage = { fileId: string; url: string; width: number; height: number }

// Firma la portada de un proyecto (URLs de ImageKit); deja intactas las demo.
function signCover<T extends { coverImage: string | null }>(p: T): T {
  return p.coverImage ? { ...p, coverImage: signedDisplayUrl(p.coverImage) } : p
}

// Etiquetas de categoría por idioma para la web pública.
export const CATEGORY_LABELS: Record<'es' | 'en', Record<ProjectCategory, string>> = {
  es: { COMMERCIALS: 'Publicidad', FILM_TV: 'Cine y TV', EDITORIAL: 'Galería' },
  en: { COMMERCIALS: 'Commercials', FILM_TV: 'Film & TV', EDITORIAL: 'Gallery' },
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

// Incluye solo las reservas confirmadas (cliente + bloqueos) de cada pieza,
// que son las que restan disponibilidad.
const confirmedReservations = {
  where: { status: 'CONFIRMED' as const },
  select: { startDate: true, endDate: true, quantity: true },
}

/** Piezas de alquiler disponibles, ordenadas, con sus reservas confirmadas. */
export async function getRentalItems() {
  try {
    return await prisma.rentalItem.findMany({
      where: { available: true },
      orderBy: { order: 'asc' },
      include: { reservations: confirmedReservations },
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
      include: { reservations: confirmedReservations },
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
