'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'

// Cambia de idioma manteniendo la misma página (usa el pathname localizado).
export default function LanguageSwitch() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()

  function switchTo(next: 'es' | 'en') {
    if (next === locale) return
    // pathname es la ruta canónica (p.ej. /about o /projects/[slug]); next-intl
    // la reescribe al slug del locale destino. `params` cubre segmentos
    // dinámicos como [slug]. Cast a never para evitar la fricción con las
    // rutas tipadas de next-intl.
    router.replace({ pathname, params } as never, { locale: next })
  }

  return (
    <div className="flex items-center gap-2 text-[0.7rem] tracking-[0.15em]">
      <button
        type="button"
        onClick={() => switchTo('es')}
        className={
          locale === 'es' ? 'text-light' : 'text-muted transition-colors hover:text-accent'
        }
      >
        ES
      </button>
      <span className="text-border">/</span>
      <button
        type="button"
        onClick={() => switchTo('en')}
        className={
          locale === 'en' ? 'text-light' : 'text-muted transition-colors hover:text-accent'
        }
      >
        EN
      </button>
    </div>
  )
}
