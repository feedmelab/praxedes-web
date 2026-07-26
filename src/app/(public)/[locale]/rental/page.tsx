import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import RentalGrid from '@/components/public/RentalGrid'
import { getRentalItems, RENTAL_LABELS, type Locale, type RentalImage } from '@/lib/public-data'
import { signedDisplayUrl } from '@/lib/imagekit'
import { freeToday, nextAvailableDay } from '@/lib/rental-availability'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'rental' })
  return { title: t('title'), description: t('subtitle') }
}

export default async function RentalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw as Locale
  setRequestLocale(locale)

  const t = await getTranslations('rental')
  const rows = await getRentalItems()

  // Normaliza el JSON de imágenes a { url } para el cliente.
  const items = rows.map((r) => ({
    id: r.id,
    nameEs: r.nameEs,
    nameEn: r.nameEn,
    descEs: r.descEs,
    descEn: r.descEn,
    category: r.category,
    images: ((r.images as unknown as RentalImage[]) ?? []).map((img) => ({
      url: signedDisplayUrl(img.url),
      focal: img.focal,
    })),
    // Agotada ahora mismo (sin unidades libres hoy) y, si lo está, desde qué
    // día vuelve a haber al menos una unidad libre.
    soldOutNow: freeToday(r.stock, r.reservations) < 1,
    availableFrom:
      freeToday(r.stock, r.reservations) < 1 ? nextAvailableDay(r.stock, r.reservations) : null,
  }))

  return (
    <div className="px-6 pb-24 pt-32 sm:px-10 lg:px-16 lg:pt-44">
      <header className="mb-10 lg:mb-16">
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-normal leading-[1]">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-[52ch] text-[0.85rem] tracking-[0.04em] text-soft">
          {t('subtitle')}
        </p>
      </header>

      {items.length > 0 ? (
        <RentalGrid items={items} locale={locale} labels={RENTAL_LABELS[locale]} />
      ) : (
        <p className="text-soft">{t('empty')}</p>
      )}

      <div className="mt-16 border-t border-border pt-10 lg:mt-24">
        <Link
          href="/contact"
          className="inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.18em] text-light transition-colors hover:text-accent"
        >
          <span className="h-px w-7 bg-accent" />
          {t('cta')}
        </Link>
      </div>
    </div>
  )
}
