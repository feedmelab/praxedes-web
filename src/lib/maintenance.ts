import { createHash } from 'crypto'

// Cookie y token para saltar el modo mantenimiento (previsualización del admin).
// El token se deriva de AUTH_SECRET: estable, no revela el secreto y no requiere
// configurar ninguna variable de entorno adicional.
export const BYPASS_COOKIE = 'mnt_bypass'

export function bypassToken(): string {
  const secret = process.env.AUTH_SECRET || 'dev-secret'
  return createHash('sha256').update(`maintenance-bypass:${secret}`).digest('hex').slice(0, 32)
}

// URL de vista previa: pasa por /api/preview, que valida el token, activa la
// cookie de bypass y redirige a `to` (ruta interna). Así funciona aunque el
// admin y la web pública estén en dominios distintos.
export function previewHref(to: string): string {
  return `/api/preview?token=${bypassToken()}&to=${encodeURIComponent(to)}`
}
