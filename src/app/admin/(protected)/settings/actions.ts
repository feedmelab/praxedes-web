'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { listFiles, deleteFile } from '@/lib/imagekit'
import { aboutMedia, listAboutMedia, type AboutMediaRow } from '@/lib/about-media'
export type HeroVideo = { fileId: string; name: string; url: string; size: number }
export type { AboutMediaRow }

// Lista los vídeos subidos a la carpeta del hero en ImageKit.
export async function listHeroVideos(): Promise<HeroVideo[]> {
  const session = await auth()
  if (!session) return []

  try {
    const files = (await listFiles('/praxedes/hero', 100)) as Array<{
      fileId?: string
      name?: string
      url?: string
      size?: number
      fileType?: string
      mime?: string
    }>
    return files
      .filter((f) => f.fileId && (f.fileType === 'non-image' || (f.mime ?? '').startsWith('video')))
      .map((f) => ({ fileId: f.fileId!, name: f.name ?? '', url: f.url ?? '', size: f.size ?? 0 }))
  } catch {
    return []
  }
}

// Borra un vídeo de ImageKit; si era el fondo activo, lo quita.
export async function deleteHeroVideo(fileId: string, url: string) {
  const session = await auth()
  if (!session) return { error: 'No autorizado' }
  try {
    await deleteFile(fileId)
  } catch {
    return { error: 'No se pudo borrar en ImageKit' }
  }
  const current = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
  if (current?.reelMp4Url === url) {
    await prisma.siteSettings.update({ where: { id: 'singleton' }, data: { reelMp4Url: null } })
  }
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
  return { ok: true }
}

// Guarda la URL del vídeo de fondo (subido directamente a ImageKit desde el
// navegador). Solo acepta URLs de ImageKit por seguridad.
export async function saveHeroVideoUrl(url: string) {
  const session = await auth()
  if (!session) return { error: 'No autorizado' }
  if (!/^https:\/\/[^/]*imagekit\.io\//.test(url)) return { error: 'URL no válida' }
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: { reelMp4Url: url },
    create: { id: 'singleton', reelMp4Url: url },
  })
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
  return { ok: true }
}

// Guarda (o borra con '') la URL de una foto de «Sobre mí» subida a ImageKit.
// `slot` elige la posición del efecto cruz: centro (por defecto) o los 4 puntos.
export type AboutSlot = 'center' | 'top' | 'bottom' | 'left' | 'right'
const ABOUT_FIELD: Record<AboutSlot, string> = {
  center: 'aboutImage',
  top: 'aboutImageTop',
  bottom: 'aboutImageBottom',
  left: 'aboutImageLeft',
  right: 'aboutImageRight',
}

export async function saveAboutImage(url: string, slot: AboutSlot = 'center') {
  const session = await auth()
  if (!session) return { error: 'No autorizado' }
  const clean = url.trim()
  if (clean && !/^https:\/\/[^/]*imagekit\.io\//.test(clean)) return { error: 'URL no válida' }
  const field = ABOUT_FIELD[slot] ?? 'aboutImage'
  const data = { [field]: clean || null } as Record<string, string | null>
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  })
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
  return { ok: true }
}

// ── Medios de «Sobre mí» (lista ordenable) ──────────────────────────────────
const IK_URL = /^https:\/\/[^/]*imagekit\.io\//

export async function listAboutMediaAdmin(): Promise<AboutMediaRow[]> {
  const session = await auth()
  if (!session) return []
  return listAboutMedia()
}

export async function addAboutMedia(url: string) {
  const session = await auth()
  if (!session) return { error: 'No autorizado' }
  const clean = url.trim()
  if (!IK_URL.test(clean)) return { error: 'URL no válida' }
  const max = await aboutMedia().aggregate({ _max: { order: true } })
  const order = (max._max.order ?? -1) + 1
  await aboutMedia().create({ data: { url: clean, order } })
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteAboutMedia(id: string) {
  const session = await auth()
  if (!session) return { error: 'No autorizado' }
  try {
    await aboutMedia().delete({ where: { id } })
  } catch {
    /* ya borrado */
  }
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function reorderAboutMedia(ids: string[]) {
  const session = await auth()
  if (!session) return { error: 'No autorizado' }
  for (let i = 0; i < ids.length; i++) {
    await aboutMedia().update({ where: { id: ids[i] }, data: { order: i } })
  }
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
  return { ok: true }
}

const settingsSchema = z.object({
  reelVimeoId: z.string().optional(),
  reelMp4Url: z.string().url('URL inválida').or(z.literal('')).optional(),
  claimEs: z.string().optional(),
  claimEn: z.string().optional(),
  aboutTitleEs: z.string().optional(),
  aboutTitleEn: z.string().optional(),
  homeIntroEs: z.string().optional(),
  homeIntroEn: z.string().optional(),
  bioEs: z.string().optional(),
  bioEn: z.string().optional(),
  micInfoEs: z.string().optional(),
  micInfoEn: z.string().optional(),
  clientsList: z.string().optional(),
  effectBase: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido')
    .optional()
    .or(z.literal('')),
  effectAccent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido')
    .optional()
    .or(z.literal('')),
  heroDarken: z.coerce.number().int().min(0).max(100).optional(),
  heroFadeBottom: z.coerce.number().int().min(0).max(100).optional(),
  heroScrollFade: z.coerce.number().int().min(0).max(100).optional(),
  waterOpacity: z.coerce.number().int().min(0).max(250).optional(),
  waterDarken: z.coerce.number().int().min(0).max(100).optional(),
  contactEmail: z.string().email('Email inválido').or(z.literal('')).optional(),
  instagramUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  vimeoUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  // Checkbox: llega "on" si está marcado, ausente si no.
  maintenanceMode: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
  maintenanceText: z.string().max(600).optional(),
  maintenanceTextEn: z.string().max(600).optional(),
})

export async function updateSettings(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
) {
  const session = await auth()
  if (!session) return { error: 'No autorizado' }

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }

  const data = {
    reelVimeoId: parsed.data.reelVimeoId || null,
    reelMp4Url: parsed.data.reelMp4Url || null,
    claimEs: parsed.data.claimEs || null,
    claimEn: parsed.data.claimEn || null,
    aboutTitleEs: parsed.data.aboutTitleEs || null,
    aboutTitleEn: parsed.data.aboutTitleEn || null,
    homeIntroEs: parsed.data.homeIntroEs || null,
    homeIntroEn: parsed.data.homeIntroEn || null,
    bioEs: parsed.data.bioEs || null,
    bioEn: parsed.data.bioEn || null,
    micInfoEs: parsed.data.micInfoEs || null,
    micInfoEn: parsed.data.micInfoEn || null,
    clientsList: parsed.data.clientsList || null,
    effectBase: parsed.data.effectBase || null,
    effectAccent: parsed.data.effectAccent || null,
    heroDarken: parsed.data.heroDarken ?? 35,
    heroFadeBottom: parsed.data.heroFadeBottom ?? 70,
    heroScrollFade: parsed.data.heroScrollFade ?? 85,
    waterOpacity: parsed.data.waterOpacity ?? 100,
    waterDarken: parsed.data.waterDarken ?? 0,
    contactEmail: parsed.data.contactEmail || null,
    instagramUrl: parsed.data.instagramUrl || null,
    vimeoUrl: parsed.data.vimeoUrl || null,
    maintenanceMode: parsed.data.maintenanceMode ?? false,
    maintenanceText: parsed.data.maintenanceText?.trim() || null,
    maintenanceTextEn: parsed.data.maintenanceTextEn?.trim() || null,
  }

  try {
    await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    })
  } catch (e) {
    console.error('updateSettings upsert failed', e)
    return {
      error:
        'No se pudieron guardar los ajustes. ¿Falta aplicar migraciones? (prisma migrate deploy)',
    }
  }

  revalidatePath('/admin/settings')
  // Los ajustes (reel, bio, redes, email) aparecen en home, footer, sobre mí y
  // contacto → invalidar todo el árbol para que se reflejen.
  revalidatePath('/', 'layout')
  return { ok: true }
}
