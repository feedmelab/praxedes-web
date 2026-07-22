import { setRequestLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import CategoryListing from '@/components/public/CategoryListing'
import type { Locale } from '@/lib/public-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gallery' })
  return { title: t('title'), description: t('subtitle') }
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CategoryListing category="EDITORIAL" ns="gallery" locale={locale as Locale} />
}
