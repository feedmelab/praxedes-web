'use server'

import { z } from 'zod'
import { getSettings } from '@/lib/public-data'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
  // Honeypot: debe llegar vacío. Si viene relleno, es un bot.
  company: z.string().max(0).optional().or(z.literal('')),
})

export type ContactState = { status: 'idle' | 'success' | 'error' | 'invalid' }

// Envía el mensaje del formulario por email vía la API REST de Resend.
// El token vive solo en el servidor; al ser server-to-server no toca la CSP.
export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'invalid' }

  // Honeypot relleno → fingimos éxito sin enviar nada.
  if (parsed.data.company) return { status: 'success' }

  const { name, email, message } = parsed.data

  const apiKey = process.env.RESEND_API_KEY
  const settings = await getSettings()
  const to = settings?.contactEmail || process.env.CONTACT_TO
  const from = process.env.CONTACT_FROM || 'Web Práxedes <onboarding@resend.dev>'

  if (!apiKey || !to) {
    console.error('Contact: falta RESEND_API_KEY o email de destino')
    return { status: 'error' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Web — nuevo mensaje de ${name}`,
        text: `Nombre: ${name}\nEmail: ${email}\n\n${message}`,
      }),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('Resend error', res.status, await res.text())
      return { status: 'error' }
    }
    return { status: 'success' }
  } catch (e) {
    console.error('Resend fetch failed', e)
    return { status: 'error' }
  }
}
