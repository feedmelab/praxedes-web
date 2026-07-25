'use client'

import { useState, useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { createReservation, type BookingState } from '@/lib/rental-booking'
import RangeCalendar, { type Res } from './RangeCalendar'

const initial: BookingState = { status: 'idle' }

function nightsBetween(start: string, end: string) {
  if (!start || !end) return 0
  const a = new Date(`${start}T00:00:00Z`).getTime()
  const b = new Date(`${end}T00:00:00Z`).getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

// Widget de reserva con calendario: los días ocupados o pasados aparecen
// deshabilitados y no se pueden elegir. El servidor revalida al reservar.
export default function BookingWidget({
  itemId,
  stock,
  reservations,
  locale,
}: {
  itemId: string
  stock: number
  reservations: Res[]
  locale: 'es' | 'en'
}) {
  const t = useTranslations('booking')

  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [qty, setQty] = useState(1)

  const [booking, action, pending] = useActionState(createReservation, initial)

  // Al cambiar la cantidad, la disponibilidad por día cambia → reiniciamos.
  function changeQty(v: number) {
    setQty(Math.max(1, Math.min(stock, v || 1)))
    setStart('')
    setEnd('')
  }

  const nights = nightsBetween(start, end)
  const canBook = !!start && !!end && booking.status !== 'success'

  const field =
    'w-full border border-border bg-transparent px-4 py-3 text-sm text-light placeholder:text-muted focus:border-accent focus:outline-none transition-colors'
  const label = 'mb-1.5 block text-[0.66rem] uppercase tracking-[0.16em] text-muted'

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${d}T00:00:00Z`))

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

      {/* Cantidad */}
      <div className="mb-5 w-28">
        <label className={label}>{t('quantity')}</label>
        <input
          type="number"
          min={1}
          max={stock}
          value={qty}
          onChange={(e) => changeQty(Number(e.target.value))}
          className={field}
        />
      </div>

      {/* Calendario de disponibilidad */}
      <RangeCalendar
        stock={stock}
        qty={qty}
        reservations={reservations}
        start={start}
        end={end}
        locale={locale}
        onSelect={(s, e) => {
          setStart(s)
          setEnd(e)
        }}
        labels={{ occupied: t('occupied'), past: t('past'), hint: t('calendarHint') }}
      />

      {/* Resumen de selección */}
      <div className="mt-4 min-h-[1.25rem] text-xs">
        {!start && <span className="text-muted">{t('pickDates')}</span>}
        {start && !end && <span className="text-soft">{t('pickEnd')}</span>}
        {start && end && (
          <span className="text-green-400">
            {fmt(start)} → {fmt(end)} · {t('nights', { count: nights })}
          </span>
        )}
        {(start || end) && (
          <button
            type="button"
            onClick={() => {
              setStart('')
              setEnd('')
            }}
            className="ml-3 text-muted underline transition-colors hover:text-accent"
          >
            {t('clearDates')}
          </button>
        )}
      </div>

      {/* Formulario de reserva (solo con fechas válidas) */}
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
