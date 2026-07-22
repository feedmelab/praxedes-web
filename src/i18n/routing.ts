import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  pathnames: {
    '/': '/',
    '/commercials': { es: '/publicidad', en: '/commercials' },
    '/film': { es: '/cine', en: '/film' },
    '/gallery': { es: '/galeria', en: '/gallery' },
    '/rental': { es: '/alquiler', en: '/rental' },
    '/rental/[id]': { es: '/alquiler/[id]', en: '/rental/[id]' },
    '/about': { es: '/sobre-mi', en: '/about' },
    '/contact': { es: '/contacto', en: '/contact' },
    '/projects/[slug]': { es: '/proyectos/[slug]', en: '/projects/[slug]' },
  },
})
