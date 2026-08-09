import { NextResponse, type NextRequest } from 'next/server'
import { bypassToken, BYPASS_COOKIE } from '@/lib/maintenance'

// Activa la vista previa saltando el modo mantenimiento: valida el token,
// guarda una cookie de bypass y redirige a la ruta interna solicitada.
export function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  const to = url.searchParams.get('to') || '/'
  // Solo rutas internas (evita open-redirect).
  const dest = to.startsWith('/') && !to.startsWith('//') ? to : '/'

  const res = NextResponse.redirect(new URL(dest, req.url))
  if (token && token === bypassToken()) {
    res.cookies.set(BYPASS_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 h
      secure: process.env.NODE_ENV === 'production',
    })
  }
  return res
}
