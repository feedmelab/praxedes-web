import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import ProjectGallery from '@/components/public/ProjectGallery'
import {
  getProjectBySlug,
  getPublishedSlugs,
  localizedTitle,
  localizedDesc,
  CATEGORY_LABELS,
  type Locale,
} from '@/lib/public-data'

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}
  const title = `${project.client} — ${localizedTitle(project, locale as Locale)}`
  const description = localizedDesc(project, locale as Locale) ?? undefined
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: project.coverImage ? [{ url: project.coverImage }] : undefined,
    },
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale = raw as Locale
  setRequestLocale(locale)

  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const t = await getTranslations('project')
  const tc = await getTranslations('common')
  const title = localizedTitle(project, locale)
  const desc = localizedDesc(project, locale)

  return (
    <>
      {/* Hero */}
      <header className="relative flex h-[82vh] min-h-[520px] items-end overflow-hidden px-6 pb-10 pt-32 sm:px-10 lg:px-16 lg:pb-20">
        <div className="absolute inset-0 z-0">
          {project.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.coverImage}
              alt=""
              className={`h-full w-full object-cover brightness-[0.55] ${
                project.coverLetterbox ? '' : 'scale-[1.12]'
              }`}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: 'linear-gradient(135deg,#1a1714,#2a2118 55%,#0e0d0c)' }}
            />
          )}
        </div>
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        <div className="relative z-[2] w-full max-w-[1100px]">
          <div className="mb-4 text-[0.72rem] uppercase tracking-[0.28em] text-accent">
            {project.client}
          </div>
          <h1 className="font-display text-[clamp(2.4rem,7vw,5rem)] font-normal leading-[1]">
            {title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-6 text-[0.72rem] uppercase tracking-[0.16em] text-soft">
            <span>{CATEGORY_LABELS[locale][project.category]}</span>
            <span>{project.year}</span>
          </div>
        </div>
      </header>

      {/* Descripción */}
      {desc && (
        <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-6 pt-16 sm:px-10 md:grid-cols-[1fr_1.4fr] lg:gap-20 lg:px-16 lg:pt-24">
          <div className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">
            {t('overview')}
          </div>
          <p className="max-w-[60ch] whitespace-pre-line text-[clamp(1rem,1.6vw,1.15rem)] text-soft">
            {desc}
          </p>
        </section>
      )}

      {/* Galería */}
      {project.images.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 lg:mb-12">
            <h2 className="font-display text-[clamp(1.6rem,3.5vw,2.6rem)] font-normal">
              {t('gallery')}
            </h2>
            <span className="text-[0.68rem] uppercase tracking-[0.2em] text-muted">
              {t('gallerySub')}
            </span>
          </div>
          <ProjectGallery
            images={project.images}
            locale={locale}
            letterbox={!project.coverLetterbox}
          />
        </section>
      )}

      {/* Volver */}
      <div className="px-6 py-16 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-soft transition-colors hover:text-accent"
        >
          <span className="h-px w-6 bg-current" />
          {tc('back')}
        </Link>
      </div>
    </>
  )
}
