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
// `itemsList` (opcional) es el listado de prendas de una petición con varias;
// alimenta la variable {items} (una prenda por línea). Si no se pasa, {items}
// muestra la única prenda.
async function renderForCustomer(
  key: TemplateKey,
  r: ReservationInfo,
  locale: EmailLocale,
  itemsList?: { name: string; quantity: number }[]
) {
  const tpl = await getTemplate(key)
  const list =
    itemsList && itemsList.length ? itemsList : [{ name: r.itemName, quantity: r.quantity }]
  const items = list.map((i) => `· ${i.name} (x${i.quantity})`).join('\n')
  const vars = {
    name: r.name,
    items,
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

// ── Petición con VARIAS prendas (carrito) ────────────────────
type MultiRequestInfo = {
  items: { name: string; quantity: number }[]
  name: string
  email: string
  phone?: string
  notes?: string
  start: string
  end: string
}

// Solicitud recibida con varias prendas: un email al admin con el listado y un
// email de recepción al cliente (reutiliza la plantilla 'rental_request', con
// {item} = listado de prendas y {quantity} = total de unidades).
export async function sendRequestEmailsMulti(r: MultiRequestInfo, locale: string) {
  const period = `${r.start} → ${r.end}`
  const list = r.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')
  const totalQty = r.items.reduce((n, i) => n + i.quantity, 0)

  const owner = await ownerEmail()
  if (owner) {
    const lines = r.items.map((i) => `  · ${i.name} (x${i.quantity})`).join('\n')
    await resend(
      owner,
      `Nueva SOLICITUD de reserva — ${r.items.length} prenda(s)`,
      `Tienes una nueva solicitud pendiente de confirmar.\n\n` +
        `Prendas:\n${lines}\n\nFechas: ${period}\n\n` +
        `Cliente: ${r.name}\nEmail: ${r.email}\nTeléfono: ${r.phone || '—'}\nNotas: ${r.notes || '—'}\n\n` +
        `Entra en el panel → Reservas para confirmarla o rechazarla.`
    )
  } else {
    console.error('Resend alquiler: sin email de destino (contactEmail/CONTACT_TO)')
  }

  const t = await renderForCustomer(
    'rental_request',
    {
      itemName: list,
      name: r.name,
      email: r.email,
      phone: r.phone,
      notes: r.notes,
      start: r.start,
      end: r.end,
      quantity: totalQty,
    },
    norm(locale),
    r.items
  )
  await resend(r.email, t.subject, t.body)
}

// Resolución de una petición con disponibilidad PARCIAL: un ÚNICO email al
// cliente con lo confirmado y lo no disponible, en su idioma.
export async function sendGroupResolutionEmail(
  r: {
    confirmed: { name: string; quantity: number }[]
    rejected: { name: string; quantity: number }[]
    name: string
    email: string
    start: string
    end: string
  },
  locale: string
) {
  const l = norm(locale)
  const period = `${r.start} → ${r.end}`
  const line = (i: { name: string; quantity: number }) => `  · ${i.name} (x${i.quantity})`
  const conf = r.confirmed.map(line).join('\n')
  const rej = r.rejected.map(line).join('\n')

  const subject =
    l === 'en'
      ? r.rejected.length === 0
        ? 'Your rental is confirmed'
        : 'Your rental — availability update'
      : r.rejected.length === 0
        ? 'Tu reserva está confirmada'
        : 'Tu reserva — actualización de disponibilidad'

  const body =
    l === 'en'
      ? `Hi ${r.name},\n\nWe reviewed your rental request for ${period}.\n\n` +
        (r.confirmed.length ? `Confirmed:\n${conf}\n\n` : '') +
        (r.rejected.length ? `Not available for those dates:\n${rej}\n\n` : '') +
        (r.rejected.length
          ? `We're sorry for the unavailable pieces. Reply to this email and we'll help you find an alternative or new dates.\n\n`
          : `Everything is confirmed. See you soon!\n\n`) +
        `Thank you.`
      : `Hola ${r.name},\n\nHemos revisado tu solicitud de alquiler para ${period}.\n\n` +
        (r.confirmed.length ? `Confirmadas:\n${conf}\n\n` : '') +
        (r.rejected.length ? `No disponibles en esas fechas:\n${rej}\n\n` : '') +
        (r.rejected.length
          ? `Sentimos las prendas no disponibles. Responde a este email y te ayudamos a buscar una alternativa o nuevas fechas.\n\n`
          : `Todo queda confirmado. ¡Nos vemos pronto!\n\n`) +
        `Gracias.`

  await resend(r.email, subject, body)
}

// Petición con varias prendas CONFIRMADA: un email al cliente en su idioma.
export async function sendConfirmedEmailMulti(r: MultiRequestInfo, locale: string) {
  const list = r.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')
  const totalQty = r.items.reduce((n, i) => n + i.quantity, 0)
  const t = await renderForCustomer(
    'rental_confirmed',
    {
      itemName: list,
      name: r.name,
      email: r.email,
      start: r.start,
      end: r.end,
      quantity: totalQty,
    },
    norm(locale),
    r.items
  )
  await resend(r.email, t.subject, t.body)
}
