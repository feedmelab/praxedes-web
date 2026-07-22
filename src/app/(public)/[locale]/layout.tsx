import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getSettings } from '@/lib/public-data'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import Analytics from '@/components/public/Analytics'
import HtmlLang from '@/components/public/HtmlLang'

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
      <Nav />
      <main>{children}</main>
      <Footer instagramUrl={settings?.instagramUrl} vimeoUrl={settings?.vimeoUrl} />
      <Analytics />
    </NextIntlClientProvider>
  )
}
