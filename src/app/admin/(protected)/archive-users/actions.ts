'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hashPassword } from '@/lib/archive-auth'

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('No autorizado')
}

const createSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  name: z.string().trim().max(120).optional().or(z.literal('')),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export async function createArchiveUser(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
) {
  await requireAuth()
  const parsed = createSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  const email = parsed.data.email.toLowerCase()
  const exists = await prisma.archiveUser.findUnique({ where: { email } })
  if (exists) return { error: 'Ya existe un usuario con ese email.' }
  await prisma.archiveUser.create({
    data: {
      email,
      name: parsed.data.name || null,
      password: await hashPassword(parsed.data.password),
    },
  })
  revalidatePath('/admin/archive-users')
  return { ok: true }
}

export async function setArchiveUserActive(id: string, active: boolean) {
  await requireAuth()
  await prisma.archiveUser.update({ where: { id }, data: { active } })
  revalidatePath('/admin/archive-users')
}

export async function setArchiveUserPassword(id: string, password: string) {
  await requireAuth()
  if (!password || password.length < 6) return { error: 'Mínimo 6 caracteres' }
  await prisma.archiveUser.update({
    where: { id },
    data: { password: await hashPassword(password) },
  })
  revalidatePath('/admin/archive-users')
  return { ok: true }
}

export async function deleteArchiveUser(id: string) {
  await requireAuth()
  await prisma.archiveUser.delete({ where: { id } })
  revalidatePath('/admin/archive-users')
}
