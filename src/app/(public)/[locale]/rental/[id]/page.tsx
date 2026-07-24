import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import BookingWidget from '@/components/public/BookingWidget'
import RentalGallery from '@/components/public/RentalGallery'
import { signedDisplayUrl } from '@/lib/imagekit'
import {
  getRentalItem,
  getRentalItemIds,
  RENTAL_LABELS,
  type Locale,
  type RentalImage,
} from '@/lib/public-data'

export async function generateStaticParams() {
  const ids = await getRentalItemIds()
  return ids.map((id) => ({ id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  const item = await getRentalItem(id)
  if (!item) return {}
  const name = locale === 'en' ? item.nameEn : item.nameEs
  return { title: name, description: (locale === 'en' ? item.descEn : item.descEs) ?? undefined }
}

export default async function RentalItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale: raw, id } = await params
  const locale = raw as Locale
  setRequestLocale(locale)

  const item = await getRentalItem(id)
  if (!item) notFound()

  const tc = await getTranslations('common')
  const name = locale === 'en' ? item.nameEn : item.nameEs
  const desc = locale === 'en' ? item.descEn : item.descEs
  const images = ((item.images as unknown as RentalImage[]) ?? []).map((img) => ({
    ...img,
    url: signedDisplayUrl(img.url),
  }))

  return (
    <div className="px-6 pb-24 pt-32 sm:px-10 lg:px-16 lg:pt-44">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {/* Galería */}
        <RentalGallery images={images} name={name} />

        {/* Info + reserva */}
        <div>
          <div className="mb-2 text-[0.66rem] uppercase tracking-[0.2em] text-accent">
            {RENTAL_LABELS[locale][item.category]}
          </div>
          <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-normal leading-[1.05]">
            {name}
          </h1>
          {desc && <p className="mt-4 max-w-[46ch] text-soft">{desc}</p>}

          <div className="mt-8">
            <BookingWidget itemId={item.id} stock={item.stock} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[1200px] border-t border-border pt-10">
        <Link
          href="/rental"
          className="inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-soft transition-colors hover:text-accent"
        >
          <span className="h-px w-6 bg-current" />
          {tc('back')}
        </Link>
      </div>
    </div>
  )
}
