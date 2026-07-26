// Emails de alquiler vía la API REST de Resend (server-to-server; el token vive
// solo en el servidor). Dos momentos:
//   1) Solicitud recibida  → aviso al admin (ES) + "hemos recibido tu solicitud" (idioma del cliente).
//   2) Reserva confirmada  → "tu reserva está confirmada" (idioma del cliente).
import { getSettings } from '@/lib/public-data'

export type EmailLocale = 'es' | 'en'

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

const norm = (l: string): EmailLocale => (l === 'en' ? 'en' : 'es')

// Textos al cliente según idioma.
function requestText(r: ReservationInfo, period: string, locale: EmailLocale) {
  if (locale === 'en') {
    return {
      subject: `Request received — ${r.itemName}`,
      body:
        `Hi ${r.name},\n\n` +
        `We’ve received your rental request for “${r.itemName}” (x${r.quantity}) for ${period}.\n\n` +
        `It is NOT confirmed yet: we’ll review it and email you as soon as the booking is confirmed.\n\n` +
        `Thank you,\nPráxedes de Vilallonga`,
    }
  }
  return {
    subject: `Solicitud recibida — ${r.itemName}`,
    body:
      `Hola ${r.name},\n\n` +
      `Hemos recibido tu solicitud de alquiler de "${r.itemName}" (x${r.quantity}) para ${period}.\n\n` +
      `Todavía NO está confirmada: la revisaremos y te enviaremos un email en cuanto quede confirmada.\n\n` +
      `Gracias,\nPráxedes de Vilallonga`,
  }
}

function confirmedText(r: ReservationInfo, period: string, locale: EmailLocale) {
  if (locale === 'en') {
    return {
      subject: `Booking confirmed — ${r.itemName}`,
      body:
        `Hi ${r.name},\n\n` +
        `Your rental of “${r.itemName}” (x${r.quantity}) for ${period} is now CONFIRMED.\n\n` +
        `Thank you,\nPráxedes de Vilallonga`,
    }
  }
  return {
    subject: `Reserva confirmada — ${r.itemName}`,
    body:
      `Hola ${r.name},\n\n` +
      `Tu reserva de "${r.itemName}" (x${r.quantity}) para ${period} ya está CONFIRMADA.\n\n` +
      `Gracias,\nPráxedes de Vilallonga`,
  }
}

// 1) Solicitud recibida: avisa al admin (en ES) y confirma recepción al cliente
//    en su idioma.
export async function sendRequestEmails(r: ReservationInfo, locale: string) {
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
  const t = requestText(r, period, norm(locale))
  await resend(r.email, t.subject, t.body)
}

// 2) Reserva confirmada: avisa al cliente en su idioma.
export async function sendConfirmedEmail(r: ReservationInfo, locale: string) {
  const period = `${r.start} → ${r.end}`
  const t = confirmedText(r, period, norm(locale))
  await resend(r.email, t.subject, t.body)
}
