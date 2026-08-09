import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Hero from '@/components/public/Hero'
import { MIC_INFO_DEFAULT } from '@/lib/mic-info'
import AboutPhotoStage from '@/components/public/AboutPhotoStage'
import ProjectCard from '@/components/public/ProjectCard'
import Clients from '@/components/public/Clients'
import Reveal from '@/components/public/Reveal'
import {
  getSettings,
  getFeaturedProjects,
  getClients,
  localizedTitle,
  CATEGORY_LABELS,
  type Locale,
} from '@/lib/public-data'
import { CLIENTS_FALLBACK, parseClients } from '@/lib/clients'
import { listAboutMedia } from '@/lib/about-media'
import { signedDisplayUrl } from '@/lib/imagekit'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)

  const t = await getTranslations('home')
  const [settings, projects, clientRows, aboutItems] = await Promise.all([
    getSettings(),
    getFeaturedProjects(),
    getClients(),
    listAboutMedia(),
  ])
  const aboutSources = aboutItems.map((m) => signedDisplayUrl(m.url))
  // Pool de clientes: lista curada en Ajustes → clientes de proyectos → respaldo.
  const curated = parseClients(settings?.clientsList)
  const clients =
    curated.length > 0 ? curated : clientRows.length > 0 ? clientRows : CLIENTS_FALLBACK

  // Texto breve propio del teaser de la home (independiente de la bio completa
  // de la página «Sobre mí»).
  const homeIntro = locale === 'en' ? settings?.homeIntroEn : settings?.homeIntroEs
  const aboutTitle =
    (locale === 'en' ? settings?.aboutTitleEn : settings?.aboutTitleEs) || t('aboutTitle')
  const micInfo =
    (locale === 'en' ? settings?.micInfoEn : settings?.micInfoEs) || MIC_INFO_DEFAULT[locale]

  return (
    <>
      <Hero
        reelVimeoId={settings?.reelVimeoId}
        reelMp4Url={settings?.reelMp4Url}
        micInfo={micInfo}
        locale={locale}
        colorBase={settings?.effectBase}
        colorAccent={settings?.effectAccent}
        darken={settings?.heroDarken}
        fadeBottom={settings?.heroFadeBottom}
        scrollFade={settings?.heroScrollFade}
      />

      {/* Trabajo destacado */}
      {projects.length > 0 && (
        <section className="px-6 py-16 sm:px-10 lg:px-16 lg:py-36" id="work">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 lg:mb-16">
            <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-normal">
              {t('selectedWork')}
            </h2>
            <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted">
              {t('selectedWorkIdx')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-8">
            {projects.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProjectCard
                  slug={p.slug}
                  client={p.client}
                  title={localizedTitle(p, locale)}
                  meta={`${CATEGORY_LABELS[locale][p.category]} · ${p.year}`}
                  coverImage={p.coverImage}
                  coverFocal={p.coverFocal}
                  // Por defecto recorta las franjas negras; se desactiva por
                  // proyecto con «mostrar portada completa» (coverLetterbox).
                  letterbox={!p.coverLetterbox}
                  index={i}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Clientes */}
      <section className="border-y border-border px-6 py-10 text-center sm:px-10 lg:px-16 lg:py-16">
        <div className="mb-8 text-[0.66rem] uppercase tracking-[0.28em] text-muted">
          {t('clientsLabel')}
        </div>
        <div className="flex flex-wrap justify-center gap-4 font-display text-[clamp(1.1rem,2vw,1.6rem)] text-soft sm:gap-8 lg:gap-10">
          <Clients clients={clients} />
        </div>
      </section>

      {/* Sobre mí (teaser) */}
      <section className="grid grid-cols-1 items-center gap-8 px-6 py-16 sm:px-10 md:grid-cols-2 lg:gap-20 lg:px-16 lg:py-36">
        <Reveal
          className="mx-auto aspect-[4/5] w-full max-w-[460px] self-center overflow-hidden border border-border"
          as="div"
        >
          {aboutSources.length > 0 ? (
            <AboutPhotoStage sources={aboutSources} />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: 'linear-gradient(160deg,#17140f,#241d14 70%,#0d0b09)' }}
            />
          )}
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mb-6 font-display text-[clamp(1.8rem,4vw,3rem)] font-normal leading-[1.05]">
            {aboutTitle}
          </h2>
          <p className="max-w-[46ch] whitespace-pre-line text-soft">
            {homeIntro ??
              (locale === 'en'
                ? 'Práxedes de Vilallonga moves fluidly between cinema, fashion, and advertising, crafting a visual universe that oscillates between the poetic and the radical.'
                : 'Práxedes de Vilallonga se mueve con fluidez entre el cine, la moda y la publicidad, construyendo un universo visual que oscila entre lo poético y lo radical.')}
          </p>
          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-light"
          >
            <span className="h-px w-7 bg-accent transition-all duration-500 ease-out-expo" />
            {t('aboutCta')}
          </Link>
        </Reveal>
      </section>
    </>
  )
}
