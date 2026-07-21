'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const schema = z
  .object({
    current: z.string().min(1, 'Introduce la contraseña actual'),
    next: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirm: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((d) => d.next === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

export async function changePassword(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.email) return { error: 'No autorizado' }

  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { error: 'Usuario no encontrado' }

  const valid = await bcrypt.compare(parsed.data.current, user.password)
  if (!valid) return { error: 'La contraseña actual no es correcta' }

  const hash = await bcrypt.hash(parsed.data.next, 12)
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } })

  return { ok: true }
}
