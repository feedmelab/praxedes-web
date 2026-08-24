import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import ProjectBack from '@/components/public/ProjectBack'
import ProjectHero from '@/components/public/ProjectHero'
import ProjectGallery from '@/components/public/ProjectGallery'
import { SetNavSection } from '@/components/public/NavSection'
import {
  getProjectBySlug,
  getPublishedSlugs,
  localizedTitle,
  localizedDesc,
  CATEGORY_LABELS,
  type Locale,
} from '@/lib/public-data'
import { checkVimeoEmbed } from '@/lib/vimeo'

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

  // Solo cargamos el vídeo de portada si Vimeo permite su incrustación; si es
  // privado/no incrustable, no se carga y se muestra la imagen.
  const coverVideoId =
    project.vimeoId && (await checkVimeoEmbed(project.vimeoId)).ok ? project.vimeoId : null

  const t = await getTranslations('project')
  const tc = await getTranslations('common')
  const title = localizedTitle(project, locale)
  const desc = localizedDesc(project, locale)
  // Divide la descripción en párrafos (por líneas en blanco) para dar ritmo de
  // lectura en textos largos, en vez de un único bloque muy alto.
  const paragraphs = (desc ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  // Sección del menú a resaltar según la categoría del proyecto.
  const sectionHref: Record<string, string> = {
    COMMERCIALS: '/commercials',
    FILM_TV: '/film',
    EDITORIAL: '/gallery',
  }

  return (
    <>
      <SetNavSection href={sectionHref[project.category] ?? '/gallery'} />
      {/* «Volver» que aparece al llegar a la galería y acompaña el scroll. */}
      <ProjectBack label={tc('back')} />
      {/* Hero */}
      <ProjectHero
        coverImage={project.coverImage}
        coverLetterbox={project.coverLetterbox}
        vimeoId={coverVideoId}
        client={project.client}
        title={title}
        meta={[CATEGORY_LABELS[locale][project.category], String(project.year)]}
      />

      {/* Descripción */}
      {paragraphs.length > 0 && (
        <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-6 px-6 pt-16 sm:px-10 md:grid-cols-[1fr_1.4fr] lg:gap-20 lg:px-16 lg:pt-24">
          <div className="text-[0.68rem] uppercase tracking-[0.22em] text-muted md:sticky md:top-28">
            {t('overview')}
          </div>
          <div className="max-w-[62ch] space-y-5 text-[clamp(1rem,1.5vw,1.12rem)] leading-relaxed text-soft">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
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

      <div className="pb-16" />
    </>
  )
}
