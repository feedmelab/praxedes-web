'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toDay, isValidRange, freeUnits, BUFFER_DAYS } from '@/lib/rental-availability'
import { sendRequestEmails } from '@/lib/rental-emails'

// ── Comprobar disponibilidad (público) ───────────────────────

export type Availability =
  { ok: true; free: number } | { ok: false; reason: 'range' | 'notfound' | 'error' }

export async function checkAvailability(
  itemId: string,
  startISO: string,
  endISO: string
): Promise<Availability> {
  const start = toDay(startISO)
  const end = toDay(endISO)
  if (!isValidRange(start, end)) return { ok: false, reason: 'range' }

  try {
    const item = await prisma.rentalItem.findUnique({ where: { id: itemId } })
    if (!item || !item.available) return { ok: false, reason: 'notfound' }

    const reservations = await prisma.reservation.findMany({
      where: { itemId, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { startDate: true, endDate: true, quantity: true },
    })
    const free = freeUnits(item.stock, { start, end }, reservations, BUFFER_DAYS)
    return { ok: true, free: Math.max(0, free) }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

// ── Crear SOLICITUD de reserva (público) ─────────────────────
// El cliente solicita; queda PENDIENTE hasta que el admin la confirma. Se
// retiene el stock desde la solicitud para no sobrevender.

const bookingSchema = z.object({
  itemId: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  locale: z.enum(['es', 'en']).optional(),
  // Honeypot anti-bots.
  company: z.string().max(0).optional().or(z.literal('')),
})

export type BookingState = {
  status: 'idle' | 'success' | 'error' | 'invalid' | 'unavailable'
  free?: number
}

export async function createReservation(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'invalid' }
  if (parsed.data.company) return { status: 'success' } // bot

  const { itemId, quantity, name, email, phone, notes } = parsed.data
  const locale = parsed.data.locale ?? 'es'
  const start = toDay(parsed.data.start)
  const end = toDay(parsed.data.end)
  if (!isValidRange(start, end)) return { status: 'invalid' }

  try {
    // Transacción: re-comprobar disponibilidad y crear en el mismo paso para
    // evitar sobreventa ante solicitudes simultáneas.
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.rentalItem.findUnique({ where: { id: itemId } })
      if (!item || !item.available) return { ok: false as const }

      const reservations = await tx.reservation.findMany({
        where: { itemId, status: { in: ['PENDING', 'CONFIRMED'] } },
        select: { startDate: true, endDate: true, quantity: true },
      })
      const free = freeUnits(item.stock, { start, end }, reservations, BUFFER_DAYS)
      if (free < quantity) return { ok: false as const, free: Math.max(0, free) }

      await tx.reservation.create({
        data: {
          itemId,
          startDate: start,
          endDate: end,
          quantity,
          status: 'PENDING',
          kind: 'CUSTOMER',
          customerName: name,
          customerEmail: email,
          customerPhone: phone || null,
          notes: notes || null,
          locale,
        },
      })
      return { ok: true as const, item }
    })

    if (!result.ok) return { status: 'unavailable', free: result.free }

    await sendRequestEmails(
      {
        itemName: result.item.nameEs,
        name,
        email,
        phone: phone || '',
        notes: notes || '',
        start: parsed.data.start,
        end: parsed.data.end,
        quantity,
      },
      locale
    )

    revalidatePath('/admin/rental/reservations')
    // Refresca también la web pública para que el calendario de disponibilidad
    // marque de inmediato los días que acaban de ocuparse.
    revalidatePath('/', 'layout')
    return { status: 'success' }
  } catch {
    return { status: 'error' }
  }
}
