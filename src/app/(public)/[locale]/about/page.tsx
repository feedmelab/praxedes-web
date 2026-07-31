import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import Reveal from '@/components/public/Reveal'
import { getSettings, getClients, type Locale } from '@/lib/public-data'
import { CLIENTS_FALLBACK } from '@/lib/clients'

const FALLBACK_BIO = {
  es: 'Práxedes de Vilallonga se mueve con fluidez entre el cine, la moda y la publicidad, construyendo un universo visual que oscila entre lo poético y lo radical. Su debut en el cine llegó con Pacifiction (2020), dirigida por Albert Serra y protagonizada por Benoît Magimel — nominada a los premios César y Gaudí — donde su trabajo como estilista dejó una huella singular en el panorama cinematográfico europeo.\n\nDesde entonces, ha colaborado con marcas globales como Lamborghini, Jeep, Nissan, Citroën, Nike, Decathlon, Nestlé, Schweppes y Coca-Cola, siempre con una mirada intuitiva, profundamente conceptual e inconfundiblemente propia. Su estilo — una alquimia de psicología visual, narrativa cinematográfica y diseño de personajes — evita lo evidente para habitar la ambigüedad y la evocación.',
  en: 'Práxedes de Vilallonga moves fluidly between cinema, fashion, and advertising, crafting a visual universe that oscillates between the poetic and the radical. Her debut in film came with Pacifiction (2020), directed by Albert Serra and starring Benoît Magimel — nominated for both the César and Gaudí Awards — where her work as a stylist left a distinctive mark on the European cinematic landscape.\n\nSince then, she has collaborated with global brands such as Lamborghini, Jeep, Nissan, Citroën, Nike, Decathlon, Nestlé, Schweppes, and Coca-Cola, always through a lens that is intuitive, deeply conceptual, and unmistakably her own. Her style — an alchemy of visual psychology, cinematic narrative, and character design — avoids the obvious, dwelling instead in ambiguity and evocation.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return { title: t('title') }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)

  const t = await getTranslations('about')
  const [settings, clientRows] = await Promise.all([getSettings(), getClients()])
  const bio = (locale === 'en' ? settings?.bioEn : settings?.bioEs) ?? FALLBACK_BIO[locale]
  const clients = clientRows.length > 0 ? clientRows : CLIENTS_FALLBACK

  return (
    <div className="px-6 pb-24 pt-32 sm:px-10 lg:px-16 lg:pt-44">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal
          className="aspect-[4/5] max-w-[380px] overflow-hidden border border-border"
          as="div"
        >
          <div
            className="h-full w-full"
            style={{ background: 'linear-gradient(160deg,#17140f,#241d14 70%,#0d0b09)' }}
          />
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mb-8 font-display text-[clamp(2.4rem,5vw,4rem)] font-normal leading-[1.02]">
            {t('title')}
          </h1>
          <div className="max-w-[62ch] space-y-5 whitespace-pre-line text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-soft">
            {bio}
          </div>
        </Reveal>
      </div>

      <div className="mt-20 border-t border-border pt-12 lg:mt-32">
        <div className="mb-8 text-[0.66rem] uppercase tracking-[0.28em] text-muted">
          {t('clients')}
        </div>
        <div className="flex flex-wrap gap-4 font-display text-[clamp(1.1rem,2vw,1.7rem)] text-soft sm:gap-8">
          {clients.map((c) => (
            <span
              key={c}
              className="cursor-default transition-colors duration-500 ease-out-expo hover:text-light"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
