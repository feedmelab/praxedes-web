'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
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
  contactEmail: z.string().email('Email inválido').or(z.literal('')).optional(),
  instagramUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  vimeoUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
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
    contactEmail: parsed.data.contactEmail || null,
    instagramUrl: parsed.data.instagramUrl || null,
    vimeoUrl: parsed.data.vimeoUrl || null,
  }

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  })

  revalidatePath('/admin/settings')
  // Los ajustes (reel, bio, redes, email) aparecen en home, footer, sobre mí y
  // contacto → invalidar todo el árbol para que se reflejen.
  revalidatePath('/', 'layout')
  return { ok: true }
}
