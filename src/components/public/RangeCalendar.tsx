'use client'

import { useMemo, useState } from 'react'
import { BUFFER_DAYS } from '@/lib/rental-availability'

export type Res = { start: string; end: string; quantity: number }

// Fecha (UTC) → 'YYYY-MM-DD'. Tratamos las fechas como días naturales.
function iso(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`
}
function todayISO() {
  const n = new Date()
  return iso(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())))
}
function addDay(dayISO: string, n: number) {
  const [y, m, d] = dayISO.split('-').map(Number)
  return iso(new Date(Date.UTC(y, m - 1, d + n)))
}

// Calendario de rango con días ocupados/pasados deshabilitados.
// El fin es exclusivo: la fecha final es el día de devolución (no ocupa noche).
export default function RangeCalendar({
  stock,
  qty,
  reservations,
  start,
  end,
  onSelect,
  locale,
  labels,
}: {
  stock: number
  qty: number
  reservations: Res[]
  start: string
  end: string
  onSelect: (start: string, end: string) => void
  locale: 'es' | 'en'
  labels: { occupied: string; past: string; hint: string; free: string; selected: string }
}) {
  const today = todayISO()
  const [view, setView] = useState(() => {
    const [y, m] = (start || today).split('-').map(Number)
    return { y, m: m - 1 }
  })

  // Unidades libres un día concreto. Se extiende el fin de cada reserva con el
  // margen de limpieza (BUFFER_DAYS), de modo que el día siguiente a una
  // devolución también cuenta como ocupado.
  function freeOn(dayISO: string) {
    let used = 0
    for (const r of reservations) {
      if (r.start <= dayISO && dayISO < addDay(r.end, BUFFER_DAYS)) used += r.quantity
    }
    return stock - used
  }

  // ¿Algún día del rango [a, b) está lleno para la cantidad pedida?
  function rangeHasFull(a: string, b: string) {
    for (let cur = a; cur < b; cur = addDay(cur, 1)) if (freeOn(cur) < qty) return true
    return false
  }

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1))
    const startWeekday = (first.getUTCDay() + 6) % 7 // lunes = 0
    const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate()
    const arr: (string | null)[] = []
    for (let i = 0; i < startWeekday; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(iso(new Date(Date.UTC(view.y, view.m, d))))
    return arr
  }, [view])

  function pick(dayISO: string) {
    // Solo llegan días válidos (los llenos/pasados están deshabilitados).
    if (!start || (start && end) || dayISO <= start) {
      onSelect(dayISO, '')
      return
    }
    // dayISO > start → candidato a fin. No debe cruzar días ocupados.
    if (rangeHasFull(start, dayISO)) {
      onSelect(dayISO, '')
      return
    }
    onSelect(start, dayISO)
  }

  const monthLabel = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(view.y, view.m, 1)))

  const weekdays =
    locale === 'en'
      ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
      : ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

  const viewMonth = `${view.y}-${String(view.m + 1).padStart(2, '0')}`
  const canPrev = viewMonth > today.slice(0, 7)

  function shift(delta: number) {
    setView((v) => {
      const nm = v.m + delta
      return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }
    })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => canPrev && shift(-1)}
          disabled={!canPrev}
          aria-label="Mes anterior"
          className="px-2 py-1 text-lg leading-none text-soft transition-colors hover:text-accent disabled:opacity-30"
        >
          ‹
        </button>
        <span className="text-sm capitalize text-light">{monthLabel}</span>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Mes siguiente"
          className="px-2 py-1 text-lg leading-none text-soft transition-colors hover:text-accent"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((w) => (
          <div key={w} className="pb-1 text-[0.58rem] uppercase tracking-wider text-muted">
            {w}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={`b${i}`} />
          const day = Number(c.slice(8))
          const isPast = c < today
          const full = !isPast && freeOn(c) < qty
          const disabled = isPast || full
          const isEdge = c === start || (!!end && c === end)
          const inRange = !!start && !!end && c > start && c < end
          const cls = isEdge
            ? 'bg-accent text-bg font-medium'
            : inRange
              ? 'bg-accent/20 text-light'
              : full
                ? 'cursor-not-allowed bg-red-500/15 text-red-300/80 line-through'
                : isPast
                  ? 'cursor-not-allowed text-muted/25'
                  : 'cursor-pointer text-soft hover:bg-accent/10 hover:text-accent'
          return (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={() => pick(c)}
              title={full ? labels.occupied : isPast ? labels.past : ''}
              className={`flex aspect-square items-center justify-center rounded text-xs transition-colors ${cls}`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.62rem] uppercase tracking-[0.12em] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-border" />
          {labels.free}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-500/30" />
          {labels.occupied}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent" />
          {labels.selected}
        </span>
      </div>

      <p className="mt-3 text-[0.66rem] leading-relaxed text-muted">{labels.hint}</p>
    </div>
  )
}
