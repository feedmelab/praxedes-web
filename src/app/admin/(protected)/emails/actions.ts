'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { TEMPLATE_KEYS } from '@/lib/email-templates'

export async function updateEmailTemplates(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
) {
  const session = await auth()
  if (!session) return { error: 'No autorizado' }

  for (const key of TEMPLATE_KEYS) {
    const data = {
      subjectEs: String(formData.get(`${key}__subjectEs`) ?? '').trim(),
      bodyEs: String(formData.get(`${key}__bodyEs`) ?? '').trim(),
      subjectEn: String(formData.get(`${key}__subjectEn`) ?? '').trim(),
      bodyEn: String(formData.get(`${key}__bodyEn`) ?? '').trim(),
    }
    if (!data.subjectEs || !data.bodyEs || !data.subjectEn || !data.bodyEn) {
      return { error: 'Asunto y cuerpo son obligatorios en ambos idiomas.' }
    }
    await prisma.emailTemplate.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    })
  }

  revalidatePath('/admin/emails')
  return { ok: true }
}
