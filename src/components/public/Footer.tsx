import { useTranslations } from 'next-intl'

type Props = {
  instagramUrl?: string | null
  vimeoUrl?: string | null
}

export default function Footer({ instagramUrl, vimeoUrl }: Props) {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="flex flex-col gap-10 border-t border-border px-6 pb-10 pt-12 sm:px-10 lg:px-16 lg:pt-20">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="font-display text-2xl sm:text-3xl lg:text-4xl">Práxedes de Vilallonga</div>
        <div className="flex gap-6">
          {vimeoUrl && (
            <a
              href={vimeoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[0.7rem] uppercase tracking-[0.18em] text-soft transition-colors hover:text-accent"
            >
              Vimeo
            </a>
          )}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[0.7rem] uppercase tracking-[0.18em] text-soft transition-colors hover:text-accent"
            >
              Instagram
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-4 text-[0.64rem] uppercase tracking-[0.1em] text-muted">
        <span>Barcelona · {t('available')}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>© {year} Práxedes de Vilallonga</span>
          <span className="text-border">·</span>
          <span>
            Creado por{' '}
            <a
              href="mailto:xtorner@gmail.com"
              className="text-soft transition-colors hover:text-accent"
            >
              xtm
            </a>
          </span>
        </span>
      </div>
    </footer>
  )
}
