'use client'

import { useState, useTransition, useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { checkAvailability, createReservation, type BookingState } from '@/lib/rental-booking'

const initial: BookingState = { status: 'idle' }

// Widget de disponibilidad + solicitud de reserva de una pieza.
export default function BookingWidget({ itemId, stock }: { itemId: string; stock: number }) {
  const t = useTranslations('booking')

  const today = new Date().toISOString().slice(0, 10)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [qty, setQty] = useState(1)

  const [avail, setAvail] = useState<
    { state: 'idle' | 'range' | 'error' } | { state: 'ok'; free: number }
  >({ state: 'idle' })
  const [checking, startCheck] = useTransition()

  const [booking, action, pending] = useActionState(createReservation, initial)

  function onCheck() {
    if (!start || !end) return
    startCheck(async () => {
      const r = await checkAvailability(itemId, start, end)
      if (r.ok) setAvail({ state: 'ok', free: r.free })
      else setAvail({ state: r.reason === 'range' ? 'range' : 'error' })
    })
  }

  const canBook = avail.state === 'ok' && avail.free >= qty && booking.status !== 'success'
  const field =
    'w-full border border-border bg-transparent px-4 py-3 text-sm text-light placeholder:text-muted focus:border-accent focus:outline-none transition-colors'
  const label = 'mb-1.5 block text-[0.66rem] uppercase tracking-[0.16em] text-muted'

  if (booking.status === 'success') {
    return (
      <div className="border border-accent/40 bg-accent/5 px-5 py-6">
        <p className="text-sm text-accent">{t('success')}</p>
      </div>
    )
  }

  return (
    <div className="border border-border p-6 lg:p-8">
      <h2 className="mb-1 font-display text-2xl">{t('title')}</h2>
      <p className="mb-6 text-[0.7rem] uppercase tracking-[0.14em] text-muted">
        {t('stock', { stock })}
      </p>

      {/* Fechas + cantidad */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>{t('start')}</label>
          <input
            type="date"
            min={today}
            value={start}
            onChange={(e) => {
              setStart(e.target.value)
              setAvail({ state: 'idle' })
            }}
            className={field}
          />
        </div>
        <div>
          <label className={label}>{t('end')}</label>
          <input
            type="date"
            min={start || today}
            value={end}
            onChange={(e) => {
              setEnd(e.target.value)
              setAvail({ state: 'idle' })
            }}
            className={field}
          />
        </div>
        <div>
          <label className={label}>{t('quantity')}</label>
          <input
            type="number"
            min={1}
            max={stock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))}
            className={field}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onCheck}
        disabled={!start || !end || checking}
        className="mt-4 border border-border px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
      >
        {checking ? t('checking') : t('check')}
      </button>

      {/* Resultado disponibilidad */}
      <p className="mt-3 text-xs">
        {avail.state === 'idle' && <span className="text-muted">{t('selectDates')}</span>}
        {avail.state === 'range' && <span className="text-red-400">{t('rangeError')}</span>}
        {avail.state === 'error' && <span className="text-red-400">{t('error')}</span>}
        {avail.state === 'ok' && avail.free >= qty && (
          <span className="text-green-400">{t('available', { free: avail.free })}</span>
        )}
        {avail.state === 'ok' && avail.free < qty && (
          <span className="text-red-400">{t('unavailable')}</span>
        )}
      </p>

      {/* Formulario de reserva (solo si hay disponibilidad) */}
      {canBook && (
        <form action={action} className="mt-6 space-y-4 border-t border-border pt-6">
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="start" value={start} />
          <input type="hidden" name="end" value={end} />
          <input type="hidden" name="quantity" value={qty} />
          {/* Honeypot */}
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
          <input name="phone" placeholder={t('phone')} className={field} />
          <textarea name="notes" rows={3} placeholder={t('notes')} className={field} />

          {(booking.status === 'error' ||
            booking.status === 'invalid' ||
            booking.status === 'unavailable') && (
            <p className="text-xs text-red-400">
              {booking.status === 'unavailable'
                ? t('unavailable')
                : booking.status === 'invalid'
                  ? t('invalid')
                  : t('error')}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-accent px-8 py-3 text-xs font-medium uppercase tracking-[0.18em] text-bg transition-all hover:bg-accent/90 disabled:opacity-40"
          >
            {pending ? t('reserving') : t('reserve')}
          </button>
        </form>
      )}
    </div>
  )
}
