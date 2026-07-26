// Emails de alquiler vía la API REST de Resend (server-to-server; el token vive
// solo en el servidor). Dos momentos:
//   1) Solicitud recibida  → aviso al admin (ES) + "hemos recibido tu solicitud" (idioma del cliente).
//   2) Reserva confirmada  → "tu reserva está confirmada" (idioma del cliente).
import { getSettings } from '@/lib/public-data'
import { getTemplate, renderTemplate, type TemplateKey } from '@/lib/email-templates'

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

// Renderiza una plantilla (guardada o por defecto) con los datos de la reserva.
async function renderForCustomer(key: TemplateKey, r: ReservationInfo, locale: EmailLocale) {
  const tpl = await getTemplate(key)
  const vars = {
    name: r.name,
    item: r.itemName,
    quantity: r.quantity,
    period: `${r.start} → ${r.end}`,
    start: r.start,
    end: r.end,
  }
  const subject = locale === 'en' ? tpl.subjectEn : tpl.subjectEs
  const body = locale === 'en' ? tpl.bodyEn : tpl.bodyEs
  return { subject: renderTemplate(subject, vars), body: renderTemplate(body, vars) }
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
  const t = await renderForCustomer('rental_request', r, norm(locale))
  await resend(r.email, t.subject, t.body)
}

// 2) Reserva confirmada: avisa al cliente en su idioma.
export async function sendConfirmedEmail(r: ReservationInfo, locale: string) {
  const t = await renderForCustomer('rental_confirmed', r, norm(locale))
  await resend(r.email, t.subject, t.body)
}
