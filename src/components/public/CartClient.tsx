'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCart } from './CartContext'
import { createRentalRequest, type RequestState } from '@/lib/rental-booking'

const field =
  'w-full border border-border bg-transparent px-4 py-3 text-sm text-light placeholder:text-muted focus:border-accent focus:outline-none transition-colors'
const label = 'mb-1.5 block text-[0.66rem] uppercase tracking-[0.16em] text-muted'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function CartClient({ locale }: { locale: 'es' | 'en' }) {
  const t = useTranslations('cart')
  const { items, setQty, remove, clear } = useCart()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [company, setCompany] = useState('') // honeypot
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<RequestState | null>(null)

  const nameOf = (i: { nameEs: string; nameEn: string }) => (locale === 'en' ? i.nameEn : i.nameEs)
  const unavailIds = new Set((res?.unavailable ?? []).map((u) => u.itemId))
  const canSubmit = items.length > 0 && !!start && !!end && !!name && !!email && !busy

  async function submit() {
    setBusy(true)
    setRes(null)
    try {
      const r = await createRentalRequest({
        items: items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
        start,
        end,
        name,
        email,
        phone,
        notes,
        locale,
        company,
      })
      setRes(r)
      if (r.status === 'success') clear()
    } catch {
      setRes({ status: 'error' })
    } finally {
      setBusy(false)
    }
  }

  if (res?.status === 'success') {
    return (
      <div className="mx-auto max-w-[560px] py-10 text-center">
        <div className="mb-4 text-[0.66rem] uppercase tracking-[0.2em] text-accent">
          {t('sent')}
        </div>
        <h1 className="mb-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-normal">
          {t('thanksTitle')}
        </h1>
        <p className="text-soft">{t('thanksBody')}</p>
        <Link
          href="/rental"
          className="mt-8 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-light transition-colors hover:text-accent"
        >
          <span className="h-px w-6 bg-accent" />
          {t('backToRental')}
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[560px] py-10 text-center">
        <h1 className="mb-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-normal">
          {t('emptyTitle')}
        </h1>
        <p className="text-soft">{t('emptyBody')}</p>
        <Link
          href="/rental"
          className="mt-8 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-light transition-colors hover:text-accent"
        >
          <span className="h-px w-6 bg-accent" />
          {t('browse')}
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
      {/* Prendas */}
      <div>
        <h1 className="mb-6 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-normal">
          {t('title')}
        </h1>
        <ul className="divide-y divide-border border-y border-border">
          {items.map((i) => {
            const bad = unavailIds.has(i.itemId)
            const free = res?.unavailable?.find((u) => u.itemId === i.itemId)?.free
            return (
              <li key={i.itemId} className="flex items-center gap-4 py-4">
                <div className="h-16 w-14 shrink-0 overflow-hidden border border-border bg-surface">
                  {i.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-light">{nameOf(i)}</p>
                  {bad && (
                    <p className="mt-0.5 text-[0.66rem] text-red-400">
                      {free ? t('onlyFree', { n: free }) : t('noStock')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(i.itemId, i.quantity - 1)}
                    className="h-7 w-7 border border-border text-light hover:border-accent"
                    aria-label="-"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums text-light">
                    {i.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(i.itemId, i.quantity + 1)}
                    disabled={i.quantity >= i.stock}
                    className="h-7 w-7 border border-border text-light hover:border-accent disabled:opacity-40"
                    aria-label="+"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i.itemId)}
                  className="ml-1 text-[0.62rem] uppercase tracking-wider text-muted transition-colors hover:text-red-400"
                >
                  {t('remove')}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Fechas + datos */}
      <div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>{t('start')}</label>
            <input
              type="date"
              min={todayISO()}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={label}>{t('end')}</label>
            <input
              type="date"
              min={start || todayISO()}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className={label}>{t('name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={label}>{t('phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>{t('notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={field}
            />
          </div>
          {/* honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {res?.status === 'unavailable' && (
          <p className="mt-4 text-xs text-red-400">{t('someUnavailable')}</p>
        )}
        {res?.status === 'invalid' && <p className="mt-4 text-xs text-red-400">{t('invalid')}</p>}
        {res?.status === 'error' && <p className="mt-4 text-xs text-red-400">{t('error')}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-6 w-full bg-accent px-5 py-3.5 text-[0.72rem] uppercase tracking-[0.18em] text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? t('sending') : t('submit')}
        </button>
      </div>
    </div>
  )
}
