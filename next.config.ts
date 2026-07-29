import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' player.vimeo.com www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: *.imagekit.io i.vimeocdn.com www.googletagmanager.com www.google-analytics.com picsum.photos fastly.picsum.photos images.unsplash.com",
      'frame-src player.vimeo.com',
      "connect-src 'self' *.neon.tech api.imagekit.io vimeo.com player.vimeo.com www.google-analytics.com www.googletagmanager.com",
      "media-src 'self' *.vimeocdn.com",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  experimental: {
    // Permite subir imágenes vía Server Actions (por defecto 1 MB)
    serverActions: { bodySizeLimit: '12mb' },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.imagekit.io' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
      // DEMO — fotos de ejemplo del seed. Quitar antes de producción.
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  // Bloquea iframes del panel admin desde dominios externos
  async rewrites() {
    return []
  },
}

export default withNextIntl(nextConfig)
