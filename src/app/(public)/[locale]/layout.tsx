import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getSettings } from '@/lib/public-data'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import SiteWaterBackdrop from '@/components/public/SiteWaterBackdrop'
import { NavSectionProvider } from '@/components/public/NavSection'
import { CartProvider } from '@/components/public/CartContext'
import Analytics from '@/components/public/Analytics'
import HtmlLang from '@/components/public/HtmlLang'
import MediaProtection from '@/components/public/MediaProtection'
import Intro from '@/components/public/Intro'
import Hero from '@/components/public/Hero'
import { MIC_INFO_DEFAULT } from '@/lib/mic-info'
import type { Locale } from '@/lib/public-data'

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

  // Modo mantenimiento: la web pública se reduce a la portada (vídeo + nombre),
  // sin menú, sin footer y sin el resto de contenido ni el resto de páginas.
  const maintenance = (settings as { maintenanceMode?: boolean } | null)?.maintenanceMode === true
  if (maintenance) {
    const loc = locale as Locale
    const micInfo =
      (loc === 'en' ? settings?.micInfoEn : settings?.micInfoEs) || MIC_INFO_DEFAULT[loc]
    return (
      <NextIntlClientProvider messages={messages}>
        <HtmlLang locale={locale} />
        <MediaProtection />
        <Intro />
        <main className="protected-media h-screen overflow-hidden">
          <Hero
            reelVimeoId={settings?.reelVimeoId}
            reelMp4Url={settings?.reelMp4Url}
            micInfo={micInfo}
            locale={loc === 'en' ? 'en' : 'es'}
            colorBase={settings?.effectBase}
            colorAccent={settings?.effectAccent}
            darken={settings?.heroDarken}
            fadeBottom={settings?.heroFadeBottom}
            scrollFade={settings?.heroScrollFade}
            hideScroll
            notice={(settings as { maintenanceText?: string | null } | null)?.maintenanceText}
          />
        </main>
        <Analytics />
      </NextIntlClientProvider>
    )
  }

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
      <CartProvider>
        <NavSectionProvider>
          <Nav />
          <main className="protected-media">{children}</main>
        </NavSectionProvider>
        <Footer instagramUrl={settings?.instagramUrl} vimeoUrl={settings?.vimeoUrl} />
      </CartProvider>
      <Analytics />
    </NextIntlClientProvider>
  )
}
