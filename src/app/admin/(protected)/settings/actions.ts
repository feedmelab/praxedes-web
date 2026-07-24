'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const settingsSchema = z.object({
  reelVimeoId: z.string().optional(),
  claimEs: z.string().optional(),
  claimEn: z.string().optional(),
  bioEs: z.string().optional(),
  bioEn: z.string().optional(),
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
    claimEs: parsed.data.claimEs || null,
    claimEn: parsed.data.claimEn || null,
    bioEs: parsed.data.bioEs || null,
    bioEn: parsed.data.bioEn || null,
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
