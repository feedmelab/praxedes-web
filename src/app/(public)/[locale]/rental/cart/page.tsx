import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import CartClient from '@/components/public/CartClient'
import type { Locale } from '@/lib/public-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'cart' })
  return { title: t('title') }
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <div className="px-6 pb-24 pt-32 sm:px-10 lg:px-16 lg:pt-44">
      <div className="mx-auto max-w-[1100px]">
        <CartClient locale={locale as Locale} />
      </div>
    </div>
  )
}
