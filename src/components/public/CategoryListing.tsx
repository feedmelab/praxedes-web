import { getTranslations } from 'next-intl/server'
import ProjectCard from './ProjectCard'
import Reveal from './Reveal'
import {
  getProjectsByCategory,
  localizedTitle,
  CATEGORY_LABELS,
  type Locale,
} from '@/lib/public-data'
import type { ProjectCategory } from '@prisma/client'

// Listado público de proyectos de una categoría. Reutilizado por las páginas
// /publicidad, /cine y /galeria.
export default async function CategoryListing({
  category,
  ns,
  locale,
}: {
  category: ProjectCategory
  ns: 'commercials' | 'film' | 'gallery'
  locale: Locale
}) {
  const t = await getTranslations(ns)
  const projects = await getProjectsByCategory(category)

  return (
    <div className="px-6 pb-16 pt-32 sm:px-10 lg:px-16 lg:pb-36 lg:pt-44">
      <header className="mb-10 lg:mb-16">
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-normal leading-[1]">
          {t('title')}
        </h1>
        <p className="mt-3 text-[0.8rem] uppercase tracking-[0.18em] text-soft">{t('subtitle')}</p>
      </header>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-8">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 80}>
              <ProjectCard
                slug={p.slug}
                client={p.client}
                title={localizedTitle(p, locale)}
                meta={`${CATEGORY_LABELS[locale][p.category]} · ${p.year}`}
                coverImage={p.coverImage}
                index={i}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <p className="text-soft">{locale === 'en' ? 'Coming soon.' : 'Próximamente.'}</p>
      )}
    </div>
  )
}
