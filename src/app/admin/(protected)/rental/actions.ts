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

// Refresca las páginas públicas (necesario en producción). Invalidamos todo el
// árbol porque con las rutas localizadas de next-intl la invalidación por ruta
// concreta no siempre casa.
function revalidatePublicRental() {
  revalidatePath('/', 'layout')
}

const rentalSchema = z.object({
  nameEs: z.string().min(1, 'Nombre (ES) requerido'),
  nameEn: z.string().min(1, 'Nombre (EN) requerido'),
  descEs: z.string().optional(),
  descEn: z.string().optional(),
  category: z.enum(['PERIOD', 'CONTEMPORARY', 'ACCESSORIES', 'PROPS', 'OTHER']),
  stock: z.coerce.number().int().min(1, 'Stock mínimo 1').max(999).default(1),
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
      stock: parsed.data.stock,
      order: count,
    },
  })

  revalidatePath('/admin/rental')
  revalidatePublicRental()
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
      stock: parsed.data.stock,
    },
  })

  revalidatePath('/admin/rental')
  revalidatePublicRental()
  revalidatePath(`/admin/rental/${id}`)
  return { ok: true }
}

export async function toggleAvailable(id: string, value: boolean) {
  await requireAuth()
  await prisma.rentalItem.update({ where: { id }, data: { available: value } })
  revalidatePath('/admin/rental')
  revalidatePublicRental()
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
  revalidatePublicRental()
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

export async function reorderRentalItems(ids: string[]) {
  await requireAuth()
  await prisma.$transaction(
    ids.map((id, index) => prisma.rentalItem.update({ where: { id }, data: { order: index } }))
  )
  revalidatePath('/admin/rental')
  revalidatePublicRental()
}

export async function reorderRentalImages(id: string, fileIds: string[]) {
  await requireAuth()
  const item = await prisma.rentalItem.findUnique({ where: { id } })
  if (!item) return
  const images = (item.images as unknown as RentalImage[]) ?? []
  const byId = new Map(images.map((img) => [img.fileId, img]))
  const reordered = fileIds.map((fid) => byId.get(fid)).filter(Boolean) as RentalImage[]
  // Conserva cualquier imagen que no estuviera en la lista (por seguridad)
  for (const img of images) if (!fileIds.includes(img.fileId)) reordered.push(img)

  await prisma.rentalItem.update({
    where: { id },
    data: { images: reordered as unknown as object[] },
  })
  revalidatePath(`/admin/rental/${id}`)
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

// ── Reservas (módulo E) ───────────────────────────────────────

const blockSchema = z.object({
  itemId: z.string().min(1, 'Pieza requerida'),
  start: z.string().min(1, 'Fecha inicio requerida'),
  end: z.string().min(1, 'Fecha fin requerida'),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  notes: z.string().optional(),
})

// Crea un bloqueo interno (mantenimiento / uso propio) que resta stock.
export async function createBlock(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
) {
  await requireAuth()
  const parsed = blockSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }

  const start = new Date(parsed.data.start)
  const end = new Date(parsed.data.end)
  if (!(start.getTime() < end.getTime()))
    return { error: 'La fecha de fin debe ser posterior al inicio' }

  await prisma.reservation.create({
    data: {
      itemId: parsed.data.itemId,
      startDate: start,
      endDate: end,
      quantity: parsed.data.quantity,
      status: 'CONFIRMED',
      kind: 'BLOCK',
      notes: parsed.data.notes || null,
    },
  })
  revalidatePath('/admin/rental/reservations')
  return { ok: true }
}

// Cancela una reserva (libera stock).
export async function cancelReservation(id: string) {
  await requireAuth()
  await prisma.reservation.update({ where: { id }, data: { status: 'CANCELLED' } })
  revalidatePath('/admin/rental/reservations')
}

// Borra una reserva definitivamente.
export async function deleteReservation(id: string) {
  await requireAuth()
  await prisma.reservation.delete({ where: { id } })
  revalidatePath('/admin/rental/reservations')
}
