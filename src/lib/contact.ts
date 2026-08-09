'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { getSettings } from '@/lib/public-data'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
  // Honeypot: debe llegar vacío. Si viene relleno, es un bot.
  company: z.string().max(0).optional().or(z.literal('')),
})

export type ContactState = { status: 'idle' | 'success' | 'error' | 'invalid' }

// Verifica el token de Cloudflare Turnstile contra su API. Si no hay secreto
// configurado, se omite la verificación (para no bloquear en entornos sin claves).
async function verifyTurnstile(token: FormDataEntryValue | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // sin clave → no se exige captcha
  if (typeof token !== 'string' || !token) return false

  const h = await headers()
  const ip = h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      cache: 'no-store',
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (e) {
    console.error('Turnstile verify failed', e)
    return false
  }
}

// Envía el mensaje del formulario por email vía la API REST de Resend.
// El token vive solo en el servidor; al ser server-to-server no toca la CSP.
export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'invalid' }

  // Honeypot relleno → fingimos éxito sin enviar nada.
  if (parsed.data.company) return { status: 'success' }

  // Captcha (Cloudflare Turnstile): si falla, no enviamos.
  const okCaptcha = await verifyTurnstile(formData.get('cf-turnstile-response'))
  if (!okCaptcha) return { status: 'invalid' }

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
