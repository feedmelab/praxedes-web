import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import ArchiveLoginForm from '@/components/public/ArchiveLoginForm'
import { getArchiveSession } from '@/lib/archive-auth'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'archive' })
  return { title: t('title') }
}

export default async function ArchiveLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  // Ya con sesión → al Archivo.
  const session = await getArchiveSession()
  if (session) redirect('/rental')

  return (
    <div className="px-6 pb-24 pt-32 sm:px-10 lg:px-16 lg:pt-44">
      <ArchiveLoginForm />
    </div>
  )
}
