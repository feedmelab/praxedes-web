'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { sendContact, type ContactState } from '@/lib/contact'

const initial: ContactState = { status: 'idle' }

export default function ContactForm() {
  const t = useTranslations('contact')
  const [state, action, pending] = useActionState(sendContact, initial)

  const field =
    'w-full border border-border bg-transparent px-4 py-3 text-sm text-light placeholder:text-muted focus:border-accent focus:outline-none transition-colors'

  if (state.status === 'success') {
    return (
      <p className="border border-accent/40 bg-accent/5 px-5 py-4 text-sm text-accent">
        {t('success')}
      </p>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {/* Honeypot: oculto para humanos, cebo para bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input name="name" required placeholder={t('name')} className={field} />
        <input name="email" type="email" required placeholder={t('email')} className={field} />
      </div>
      <textarea name="message" required rows={6} placeholder={t('message')} className={field} />

      {(state.status === 'error' || state.status === 'invalid') && (
        <p className="text-xs text-red-400">
          {state.status === 'invalid' ? t('invalid') : t('error')}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-accent px-8 py-3 text-xs font-medium uppercase tracking-[0.18em] text-bg transition-all hover:bg-accent/90 disabled:opacity-40"
      >
        {pending ? t('sending') : t('submit')}
      </button>
    </form>
  )
}
