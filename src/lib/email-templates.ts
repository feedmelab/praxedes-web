// Plantillas de email de alquiler: valores por defecto, interpolación de
// variables y carga desde la base de datos (si el admin las ha editado).
import { prisma } from '@/lib/prisma'

export type TemplateKey = 'rental_request' | 'rental_confirmed'
export type TemplateFields = {
  subjectEs: string
  bodyEs: string
  subjectEn: string
  bodyEn: string
}

export const TEMPLATE_KEYS: TemplateKey[] = ['rental_request', 'rental_confirmed']

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  rental_request: 'Solicitud recibida (al cliente)',
  rental_confirmed: 'Reserva confirmada (al cliente)',
}

// Variables disponibles en asunto y cuerpo.
// {items} = listado de prendas, una por línea (para peticiones con varias).
// {item}  = nombre (o listado en una línea) — se mantiene por compatibilidad.
export const TEMPLATE_VARS = [
  '{name}',
  '{items}',
  '{item}',
  '{quantity}',
  '{period}',
  '{start}',
  '{end}',
]

export const TEMPLATE_DEFAULTS: Record<TemplateKey, TemplateFields> = {
  rental_request: {
    subjectEs: 'Solicitud recibida',
    bodyEs:
      'Hola {name},\n\n' +
      'Hemos recibido tu solicitud de alquiler para {period}:\n\n' +
      '{items}\n\n' +
      'Todavía NO está confirmada: la revisaremos y te enviaremos un email en cuanto quede confirmada.\n\n' +
      'Gracias,\nPráxedes de Vilallonga',
    subjectEn: 'Request received',
    bodyEn:
      'Hi {name},\n\n' +
      'We’ve received your rental request for {period}:\n\n' +
      '{items}\n\n' +
      'It is NOT confirmed yet: we’ll review it and email you as soon as the booking is confirmed.\n\n' +
      'Thank you,\nPráxedes de Vilallonga',
  },
  rental_confirmed: {
    subjectEs: 'Reserva confirmada',
    bodyEs:
      'Hola {name},\n\n' +
      'Tu reserva para {period} ya está CONFIRMADA:\n\n' +
      '{items}\n\n' +
      'Gracias,\nPráxedes de Vilallonga',
    subjectEn: 'Booking confirmed',
    bodyEn:
      'Hi {name},\n\n' +
      'Your rental for {period} is now CONFIRMED:\n\n' +
      '{items}\n\n' +
      'Thank you,\nPráxedes de Vilallonga',
  },
}

// Sustituye {var} por su valor; deja intactas las que no reconoce.
export function renderTemplate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_m, k: string) => (k in vars ? String(vars[k]) : `{${k}}`))
}

// Plantilla efectiva: la guardada por el admin o, si no existe, la de por defecto.
export async function getTemplate(key: TemplateKey): Promise<TemplateFields> {
  try {
    const row = await prisma.emailTemplate.findUnique({ where: { key } })
    if (row) {
      return {
        subjectEs: row.subjectEs,
        bodyEs: row.bodyEs,
        subjectEn: row.subjectEn,
        bodyEn: row.bodyEn,
      }
    }
  } catch {
    // Sin fila o tabla no migrada aún → defaults.
  }
  return TEMPLATE_DEFAULTS[key]
}
