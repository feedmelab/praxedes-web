import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getSettings } from '@/lib/public-data'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import SiteWaterBackdrop from '@/components/public/SiteWaterBackdrop'
import { NavSectionProvider } from '@/components/public/NavSection'
import Analytics from '@/components/public/Analytics'
import HtmlLang from '@/components/public/HtmlLang'
import MediaProtection from '@/components/public/MediaProtection'
import Intro from '@/components/public/Intro'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'es' | 'en')) notFound()
  setRequestLocale(locale)

  const [messages, settings] = await Promise.all([getMessages(), getSettings()])

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLang locale={locale} />
      <MediaProtection />
      <Intro />
      {/* Fondo de «agua» global (home: tras el hero; internas: en el header) */}
      <SiteWaterBackdrop
        darken={(settings?.heroDarken ?? 35) / 100}
        waterOpacity={settings?.waterOpacity ?? 100}
        waterDarken={settings?.waterDarken ?? 0}
        mp4={settings?.reelMp4Url}
        vimeoId={settings?.reelVimeoId}
      />
      <NavSectionProvider>
        <Nav />
        <main className="protected-media">{children}</main>
      </NavSectionProvider>
      <Footer instagramUrl={settings?.instagramUrl} vimeoUrl={settings?.vimeoUrl} />
      <Analytics />
    </NextIntlClientProvider>
  )
}
