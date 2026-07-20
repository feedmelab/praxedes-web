import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

const rateLimitMap = new Map<string, { count: number; ts: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 10

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const data = rateLimitMap.get(ip)
  if (!data || now - data.ts > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, ts: now })
    return true
  }
  if (data.count >= RATE_LIMIT_MAX) return false
  data.count++
  return true
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit en login
  if (pathname === '/admin/login' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!rateLimit(ip)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  // Rutas admin
  if (pathname.startsWith('/admin')) {
    // Login siempre accesible
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    const token =
      request.cookies.get('authjs.session-token') ??
      request.cookies.get('__Secure-authjs.session-token')

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
  }

  // Rutas públicas — i18n
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/(es|en)/:path*',
    '/((?!_next|api|favicon\\.ico|images|fonts|robots\\.txt|sitemap\\.xml).*)',
  ],
}
