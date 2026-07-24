'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/public-data'
import { toDay, isValidRange, freeUnits } from '@/lib/rental-availability'

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
      where: { itemId, status: 'CONFIRMED' },
      select: { startDate: true, endDate: true, quantity: true },
    })
    const free = freeUnits(item.stock, { start, end }, reservations)
    return { ok: true, free: Math.max(0, free) }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

// ── Crear reserva (público, auto-confirma si hay stock) ───────

const bookingSchema = z.object({
  itemId: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
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
        where: { itemId, status: 'CONFIRMED' },
        select: { startDate: true, endDate: true, quantity: true },
      })
      const free = freeUnits(item.stock, { start, end }, reservations)
      if (free < quantity) return { ok: false as const, free: Math.max(0, free) }

      await tx.reservation.create({
        data: {
          itemId,
          startDate: start,
          endDate: end,
          quantity,
          status: 'CONFIRMED',
          kind: 'CUSTOMER',
          customerName: name,
          customerEmail: email,
          customerPhone: phone || null,
          notes: notes || null,
        },
      })
      return { ok: true as const, item }
    })

    if (!result.ok) return { status: 'unavailable', free: result.free }

    await sendReservationEmails({
      itemName: result.item.nameEs,
      name,
      email,
      phone: phone || '',
      notes: notes || '',
      start: parsed.data.start,
      end: parsed.data.end,
      quantity,
    })

    revalidatePath('/admin/rental/reservations')
    return { status: 'success' }
  } catch {
    return { status: 'error' }
  }
}

// ── Emails (Resend REST, server-to-server) ───────────────────

async function sendReservationEmails(r: {
  itemName: string
  name: string
  email: string
  phone: string
  notes: string
  start: string
  end: string
  quantity: number
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('Resend reserva: falta RESEND_API_KEY en el entorno')
    return
  }

  const settings = await getSettings()
  const owner = settings?.contactEmail || process.env.CONTACT_TO
  const from = process.env.CONTACT_FROM || 'Reservas Práxedes <onboarding@resend.dev>'
  if (!owner) console.error('Resend reserva: sin email de destino (contactEmail/CONTACT_TO)')

  const period = `${r.start} → ${r.end}`
  const send = async (to: string, subject: string, text: string) => {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text }),
        cache: 'no-store',
      })
      if (!res.ok) {
        // Visible en los logs de la función (Vercel → Logs).
        console.error('Resend reserva error', res.status, await res.text())
      }
    } catch (e) {
      console.error('Resend reserva fetch failed', e)
    }
  }

  // Aviso a Práxedes
  if (owner) {
    await send(
      owner,
      `Nueva reserva — ${r.itemName}`,
      `Pieza: ${r.itemName} (x${r.quantity})\nFechas: ${period}\n\nCliente: ${r.name}\nEmail: ${r.email}\nTeléfono: ${r.phone || '—'}\nNotas: ${r.notes || '—'}`
    )
  }
  // Confirmación al cliente
  await send(
    r.email,
    `Reserva confirmada — ${r.itemName}`,
    `Hola ${r.name},\n\nTu reserva de "${r.itemName}" (x${r.quantity}) para ${period} está confirmada.\n\nGracias,\nPráxedes de Vilallonga`
  )
}
