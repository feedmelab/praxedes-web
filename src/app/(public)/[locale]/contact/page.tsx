import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import ContactForm from '@/components/public/ContactForm'
import { getSettings } from '@/lib/public-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return { title: t('title'), description: t('intro') }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')
  const settings = await getSettings()

  return (
    <div className="px-6 pb-24 pt-32 sm:px-10 lg:px-16 lg:pt-44">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 md:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <h1 className="font-display text-[clamp(2.4rem,5vw,4rem)] font-normal leading-[1.02]">
            {t('title')}
          </h1>
          <p className="mt-6 max-w-[38ch] text-soft">{t('intro')}</p>

          {settings?.contactEmail && (
            <p className="mt-8 text-[0.72rem] uppercase tracking-[0.16em] text-muted">
              {t('orEmail')}
              <br />
              <a
                href={`mailto:${settings.contactEmail}`}
                className="mt-2 inline-block text-sm normal-case tracking-normal text-light transition-colors hover:text-accent"
              >
                {settings.contactEmail}
              </a>
            </p>
          )}
        </div>

        <div>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
