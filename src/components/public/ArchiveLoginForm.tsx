'use client'

import { useActionState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { archiveLogin, type ArchiveLoginState } from '@/lib/archive-actions'

const field =
  'w-full border border-border bg-transparent px-4 py-3 text-sm text-light placeholder:text-muted focus:border-accent focus:outline-none transition-colors'
const label = 'mb-1.5 block text-[0.66rem] uppercase tracking-[0.16em] text-muted'

export default function ArchiveLoginForm() {
  const t = useTranslations('archive')
  const router = useRouter()
  const [state, action, pending] = useActionState<ArchiveLoginState, FormData>(archiveLogin, null)

  useEffect(() => {
    if (state?.ok) router.replace('/rental')
  }, [state, router])

  return (
    <div className="mx-auto max-w-[420px] py-10">
      <h1 className="mb-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-normal">
        {t('title')}
      </h1>
      <p className="mb-8 text-sm text-soft">{t('subtitle')}</p>

      <form action={action} className="space-y-4">
        <div>
          <label className={label} htmlFor="ar-email">
            {t('email')}
          </label>
          <input
            id="ar-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="ar-pass">
            {t('password')}
          </label>
          <input
            id="ar-pass"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={field}
          />
        </div>

        {state?.error && <p className="text-xs text-red-400">{t('error')}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-accent px-5 py-3.5 text-[0.72rem] uppercase tracking-[0.18em] text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? t('loading') : t('submit')}
        </button>
      </form>

      <p className="mt-6 text-[0.72rem] text-muted">{t('help')}</p>
    </div>
  )
}
