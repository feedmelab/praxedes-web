// Emails de alquiler vía la API REST de Resend (server-to-server; el token vive
// solo en el servidor). Dos momentos:
//   1) Solicitud recibida  → aviso al admin + "hemos recibido tu solicitud".
//   2) Reserva confirmada  → "tu reserva está confirmada" al cliente.
import { getSettings } from '@/lib/public-data'

type ReservationInfo = {
  itemName: string
  name: string
  email: string
  phone?: string
  notes?: string
  start: string
  end: string
  quantity: number
}

async function resend(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('Resend alquiler: falta RESEND_API_KEY en el entorno')
    return
  }
  const from = process.env.CONTACT_FROM || 'Reservas Práxedes <onboarding@resend.dev>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
      cache: 'no-store',
    })
    if (!res.ok) console.error('Resend alquiler error', res.status, await res.text())
  } catch (e) {
    console.error('Resend alquiler fetch failed', e)
  }
}

async function ownerEmail() {
  const settings = await getSettings()
  return settings?.contactEmail || process.env.CONTACT_TO || null
}

// 1) Solicitud recibida: avisa al admin y confirma al cliente que la ha recibido.
export async function sendRequestEmails(r: ReservationInfo) {
  const period = `${r.start} → ${r.end}`
  const owner = await ownerEmail()
  if (owner) {
    await resend(
      owner,
      `Nueva SOLICITUD de reserva — ${r.itemName}`,
      `Tienes una nueva solicitud pendiente de confirmar.\n\n` +
        `Pieza: ${r.itemName} (x${r.quantity})\nFechas: ${period}\n\n` +
        `Cliente: ${r.name}\nEmail: ${r.email}\nTeléfono: ${r.phone || '—'}\nNotas: ${r.notes || '—'}\n\n` +
        `Entra en el panel → Reservas para confirmarla o rechazarla.`
    )
  } else {
    console.error('Resend alquiler: sin email de destino (contactEmail/CONTACT_TO)')
  }
  await resend(
    r.email,
    `Solicitud recibida — ${r.itemName}`,
    `Hola ${r.name},\n\n` +
      `Hemos recibido tu solicitud de alquiler de "${r.itemName}" (x${r.quantity}) para ${period}.\n\n` +
      `Todavía NO está confirmada: la revisaremos y te enviaremos un email en cuanto quede confirmada.\n\n` +
      `Gracias,\nPráxedes de Vilallonga`
  )
}

// 2) Reserva confirmada: avisa al cliente de que su reserva ya está confirmada.
export async function sendConfirmedEmail(r: ReservationInfo) {
  const period = `${r.start} → ${r.end}`
  await resend(
    r.email,
    `Reserva confirmada — ${r.itemName}`,
    `Hola ${r.name},\n\n` +
      `Tu reserva de "${r.itemName}" (x${r.quantity}) para ${period} ya está CONFIRMADA.\n\n` +
      `Gracias,\nPráxedes de Vilallonga`
  )
}
