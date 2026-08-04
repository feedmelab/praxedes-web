'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { archiveLogout } from '@/lib/archive-actions'

export default function ArchiveLogout() {
  const t = useTranslations('archive')
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await archiveLogout()
          router.replace('/rental/login')
        })
      }
      className="text-[0.66rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent disabled:opacity-40"
    >
      {t('logout')}
    </button>
  )
}
