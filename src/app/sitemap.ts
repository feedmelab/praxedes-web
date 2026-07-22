import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getPublishedSlugs } from '@/lib/public-data'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praxedesdevilallonga.com'

// Rutas internas (keys de routing.pathnames) que van al sitemap.
const STATIC = ['/', '/commercials', '/film', '/gallery', '/rental', '/about', '/contact'] as const

// Resuelve el slug localizado de una ruta interna para un idioma.
function localizedPath(href: string, locale: 'es' | 'en'): string {
  const p = routing.pathnames[href as keyof typeof routing.pathnames]
  if (!p) return href
  return typeof p === 'string' ? p : p[locale]
}

function url(path: string, locale: 'es' | 'en'): string {
  const clean = path === '/' ? '' : path
  return `${BASE}/${locale}${clean}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublishedSlugs()
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const href of STATIC) {
      entries.push({
        url: url(localizedPath(href, locale), locale),
        lastModified: now,
        // Enlaces alternativos por idioma (hreflang) para SEO multilingüe.
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, url(localizedPath(href, l), l)])
          ),
        },
      })
    }
    for (const slug of slugs) {
      const tpl = localizedPath('/projects/[slug]', locale).replace('[slug]', slug)
      entries.push({
        url: url(tpl, locale),
        lastModified: now,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [
              l,
              url(localizedPath('/projects/[slug]', l).replace('[slug]', slug), l),
            ])
          ),
        },
      })
    }
  }

  return entries
}
