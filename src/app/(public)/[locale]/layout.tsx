import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { cookies } from 'next/headers'
import { routing } from '@/i18n/routing'
import { getSettings } from '@/lib/public-data'
import { auth } from '@/lib/auth'
import { bypassToken, BYPASS_COOKIE } from '@/lib/maintenance'
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
import LanguageSwitch from '@/components/public/LanguageSwitch'
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
  // NUNCA se aplica en local (aunque esté activado en producción y aunque se
  // arranque con un build de producción): se detecta por el host de la petición.
  const host = (await headers()).get('host') || ''
  const isLocalHost =
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(host) || host.endsWith('.local')
  let maintenance =
    settings?.maintenanceMode === true && process.env.NODE_ENV === 'production' && !isLocalHost
  // Excepción (previsualización del admin): se salta el mantenimiento si hay
  // cookie de bypass válida (activada desde el enlace de vista previa) o una
  // sesión de admin válida (cuando admin y web comparten dominio).
  if (maintenance) {
    const hasBypass = (await cookies()).get(BYPASS_COOKIE)?.value === bypassToken()
    if (hasBypass) maintenance = false
    else {
      const session = await auth()
      if (session) maintenance = false
    }
  }
  if (maintenance) {
    const loc = locale as Locale
    const micInfo =
      (loc === 'en' ? settings?.micInfoEn : settings?.micInfoEs) || MIC_INFO_DEFAULT[loc]
    // Aviso según idioma, con reserva al texto en ES si el de EN está vacío.
    // (cast puntual: el campo EN existe en el cliente Prisma tras regenerar).
    const mEn = (settings as { maintenanceTextEn?: string | null } | null)?.maintenanceTextEn
    const mEs = settings?.maintenanceText
    const notice = (loc === 'en' ? mEn : mEs) || mEs || mEn
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
            notice={notice}
          />
          {/* Selector de idioma flotante (no hay menú en mantenimiento). */}
          <div className="fixed right-6 top-6 z-[60]">
            <LanguageSwitch />
          </div>
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
