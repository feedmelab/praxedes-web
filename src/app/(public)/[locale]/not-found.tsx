import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

// 404 dentro del árbol público (se muestra cuando notFound() salta en una
// página de este segmento, p.ej. un slug de proyecto inexistente).
export default function NotFound() {
  const t = useTranslations('notFound')

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-[clamp(4rem,12vw,9rem)] leading-none text-border">404</p>
      <h1 className="mt-4 font-display text-[clamp(1.6rem,4vw,2.6rem)] font-normal">
        {t('title')}
      </h1>
      <p className="mt-3 max-w-[40ch] text-soft">{t('text')}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.2em] text-light transition-colors hover:text-accent"
      >
        <span className="h-px w-7 bg-accent" />
        {t('home')}
      </Link>
    </div>
  )
}
