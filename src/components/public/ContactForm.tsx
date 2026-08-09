'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { sendContact, type ContactState } from '@/lib/contact'

const initial: ContactState = { status: 'idle' }
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// Tipado mínimo de la API global de Turnstile.
type Turnstile = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      callback?: (token: string) => void
      'error-callback'?: () => void
      'expired-callback'?: () => void
      theme?: 'auto' | 'light' | 'dark'
    }
  ) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

export default function ContactForm() {
  const t = useTranslations('contact')
  const [state, action, pending] = useActionState(sendContact, initial)
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const idRef = useRef<string | null>(null)

  // Render explícito del widget cuando el script está listo.
  useEffect(() => {
    if (!SITE_KEY || !ready || !window.turnstile || !boxRef.current || idRef.current) return
    idRef.current = window.turnstile.render(boxRef.current, {
      sitekey: SITE_KEY,
      theme: 'dark',
      callback: (tk) => setToken(tk),
      'error-callback': () => setToken(''),
      'expired-callback': () => setToken(''),
    })
  }, [ready])

  // El token es de un solo uso: tras un intento fallido, reinicia el widget.
  useEffect(() => {
    if (
      (state.status === 'error' || state.status === 'invalid') &&
      idRef.current &&
      window.turnstile
    ) {
      window.turnstile.reset(idRef.current)
      setToken('')
    }
  }, [state])

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
    <>
      {SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setReady(true)}
        />
      )}

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

        {/* Widget captcha (invisible/gestionado). Turnstile inyecta aquí dentro el
            input cf-turnstile-response que viaja con el formulario. */}
        {SITE_KEY && <div ref={boxRef} />}

        {(state.status === 'error' || state.status === 'invalid') && (
          <p className="text-xs text-red-400">
            {state.status === 'invalid' ? t('invalid') : t('error')}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || (!!SITE_KEY && !token)}
          className="mt-2 bg-accent px-8 py-3 text-xs font-medium uppercase tracking-[0.18em] text-bg transition-all hover:bg-accent/90 disabled:opacity-40"
        >
          {pending ? t('sending') : t('submit')}
        </button>
      </form>
    </>
  )
}
