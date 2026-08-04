'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword, setArchiveSession, clearArchiveSession } from '@/lib/archive-auth'

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type ArchiveLoginState = { error?: 'invalid' | 'bad'; ok?: boolean } | null

// Login del Archivo (cuenta de cliente). Verifica email+clave y crea la sesión.
export async function archiveLogin(
  _prev: ArchiveLoginState,
  formData: FormData
): Promise<ArchiveLoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'invalid' }
  const email = parsed.data.email.toLowerCase()
  const user = await prisma.archiveUser.findUnique({ where: { email } })
  if (!user || !user.active) return { error: 'bad' }
  const valid = await verifyPassword(parsed.data.password, user.password)
  if (!valid) return { error: 'bad' }
  await setArchiveSession({ id: user.id, email: user.email })
  return { ok: true }
}

export async function archiveLogout(): Promise<void> {
  await clearArchiveSession()
}
