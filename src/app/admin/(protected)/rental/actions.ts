'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { uploadFile, deleteFile } from '@/lib/imagekit'
import type { RentalCategory } from '@prisma/client'

export type RentalImage = { fileId: string; url: string; width: number; height: number }

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error('No autorizado')
}

const rentalSchema = z.object({
  nameEs: z.string().min(1, 'Nombre (ES) requerido'),
  nameEn: z.string().min(1, 'Nombre (EN) requerido'),
  descEs: z.string().optional(),
  descEn: z.string().optional(),
  category: z.enum(['PERIOD', 'CONTEMPORARY', 'ACCESSORIES', 'PROPS', 'OTHER']),
})

export async function createRentalItem(formData: FormData) {
  await requireAuth()
  const parsed = rentalSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }

  const count = await prisma.rentalItem.count()
  const item = await prisma.rentalItem.create({
    data: {
      ...parsed.data,
      category: parsed.data.category as RentalCategory,
      descEs: parsed.data.descEs || null,
      descEn: parsed.data.descEn || null,
      order: count,
    },
  })

  revalidatePath('/admin/rental')
  redirect(`/admin/rental/${item.id}`)
}

export async function updateRentalItem(id: string, formData: FormData) {
  await requireAuth()
  const parsed = rentalSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }

  await prisma.rentalItem.update({
    where: { id },
    data: {
      ...parsed.data,
      category: parsed.data.category as RentalCategory,
      descEs: parsed.data.descEs || null,
      descEn: parsed.data.descEn || null,
    },
  })

  revalidatePath('/admin/rental')
  revalidatePath(`/admin/rental/${id}`)
  return { ok: true }
}

export async function toggleAvailable(id: string, value: boolean) {
  await requireAuth()
  await prisma.rentalItem.update({ where: { id }, data: { available: value } })
  revalidatePath('/admin/rental')
  revalidatePath(`/admin/rental/${id}`)
}

export async function deleteRentalItem(id: string) {
  await requireAuth()
  const item = await prisma.rentalItem.findUnique({ where: { id } })
  if (!item) return
  const images = (item.images as unknown as RentalImage[]) ?? []
  await Promise.allSettled(images.map((img) => deleteFile(img.fileId)))
  await prisma.rentalItem.delete({ where: { id } })
  revalidatePath('/admin/rental')
  redirect('/admin/rental')
}

export async function addRentalImage(id: string, formData: FormData) {
  await requireAuth()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Archivo requerido' }

  const buffer = Buffer.from(await file.arrayBuffer())
  const uploaded = await uploadFile(buffer, file.name, `rental/${id}`, [id, 'rental'])

  const item = await prisma.rentalItem.findUnique({ where: { id } })
  if (!item) return { error: 'No encontrado' }
  const images = (item.images as unknown as RentalImage[]) ?? []
  images.push({
    fileId: uploaded.fileId,
    url: uploaded.url,
    width: uploaded.width,
    height: uploaded.height,
  })

  await prisma.rentalItem.update({
    where: { id },
    data: { images: images as unknown as object[] },
  })
  revalidatePath(`/admin/rental/${id}`)
  return { ok: true }
}

export async function deleteRentalImage(id: string, fileId: string) {
  await requireAuth()
  const item = await prisma.rentalItem.findUnique({ where: { id } })
  if (!item) return
  const images = (item.images as unknown as RentalImage[]) ?? []
  const remaining = images.filter((img) => img.fileId !== fileId)

  await Promise.allSettled([deleteFile(fileId)])
  await prisma.rentalItem.update({
    where: { id },
    data: { images: remaining as unknown as object[] },
  })
  revalidatePath(`/admin/rental/${id}`)
}
