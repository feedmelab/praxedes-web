'use client'

import { useMemo, useState, useTransition } from 'react'
import { Card, Badge } from '../../_components/ui'
import { cancelReservation, deleteReservation, createBlock } from '../actions'

type Reservation = {
  id: string
  itemId: string
  itemName: string
  startDate: string
  endDate: string
  quantity: number
  status: 'CONFIRMED' | 'CANCELLED'
  kind: 'CUSTOMER' | 'BLOCK'
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  notes: string | null
  createdAt: string
}

type ItemOption = { id: string; name: string; stock: number }

const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 10)

// '5 ago 2026' — fecha legible (en UTC para no desplazar el día).
const fmtLong = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))

// '5 ago 2026, 14:30' — fecha y hora (para "reservado el").
const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

const nights = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))

// Fila etiqueta / valor del bloque de detalle.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="text-[13px] text-light">{children}</dd>
    </>
  )
}

export default function ReservationsManager({
  reservations,
  items,
}: {
  reservations: Reservation[]
  items: ItemOption[]
}) {
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
  const [pending, startTransition] = useTransition()
  const [blockState, setBlockState] = useState<{ error?: string; ok?: boolean } | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (r.status === 'CANCELLED') return tab === 'cancelled'
      const isPast = fmt(r.endDate) < today
      if (tab === 'upcoming') return !isPast
      if (tab === 'past') return isPast
      return false
    })
  }, [reservations, tab, today])

  function onCancel(id: string) {
    startTransition(() => cancelReservation(id))
  }
  function onDelete(id: string) {
    startTransition(() => deleteReservation(id))
  }
  function onBlock(fd: FormData) {
    startTransition(async () => {
      const res = await createBlock(null, fd)
      setBlockState(res)
    })
  }

  const tabBtn = (active: boolean) =>
    `px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] border transition-colors ${
      active ? 'border-accent text-accent' : 'border-border text-muted hover:text-light'
    }`
  const input =
    'w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-light focus:border-accent focus:outline-none'

  return (
    <div className="space-y-8">
      {/* Crear bloqueo interno */}
      <Card>
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted">
          Bloqueo interno (mantenimiento / uso propio)
        </h2>
        <form action={onBlock} className="grid gap-3 sm:grid-cols-5">
          <select name="itemId" required className={input} defaultValue="">
            <option value="" disabled>
              Pieza…
            </option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} (stock {it.stock})
              </option>
            ))}
          </select>
          <input type="date" name="start" required min={today} className={input} />
          <input type="date" name="end" required min={today} className={input} />
          <input type="number" name="quantity" min={1} defaultValue={1} className={input} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-accent px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-bg transition-all hover:bg-accent/90 disabled:opacity-40"
          >
            Bloquear
          </button>
        </form>
        {blockState?.error && <p className="mt-2 text-xs text-red-400">{blockState.error}</p>}
        {blockState?.ok && <p className="mt-2 text-xs text-green-400">Bloqueo creado.</p>}
      </Card>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          type="button"
          className={tabBtn(tab === 'upcoming')}
          onClick={() => setTab('upcoming')}
        >
          Próximas
        </button>
        <button type="button" className={tabBtn(tab === 'past')} onClick={() => setTab('past')}>
          Pasadas
        </button>
        <button
          type="button"
          className={tabBtn(tab === 'cancelled')}
          onClick={() => setTab('cancelled')}
        >
          Canceladas
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No hay reservas en esta vista.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const n = nights(r.startDate, r.endDate)
            return (
              <div
                key={r.id}
                className={`rounded border bg-surface p-5 ${
                  r.status === 'CANCELLED' ? 'border-border opacity-60' : 'border-border'
                }`}
              >
                {/* Cabecera: pieza + estado + acciones */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-xl text-light">{r.itemName}</span>
                    <Badge tone={r.kind === 'BLOCK' ? 'muted' : 'accent'}>
                      {r.kind === 'BLOCK' ? 'Bloqueo interno' : 'Reserva de cliente'}
                    </Badge>
                    {r.status === 'CANCELLED' && <Badge tone="red">Cancelada</Badge>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {r.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onCancel(r.id)}
                        className="rounded-sm border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDelete(r.id)}
                      className="rounded-sm border border-red-500/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                    >
                      Borrar
                    </button>
                  </div>
                </div>

                {/* Detalle */}
                <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 border-t border-border pt-4 sm:grid-cols-[auto_1fr_auto_1fr]">
                  <Row label="Recogida">{fmtLong(r.startDate)}</Row>
                  <Row label="Devolución">{fmtLong(r.endDate)}</Row>
                  <Row label="Duración">
                    {n} {n === 1 ? 'noche' : 'noches'}
                  </Row>
                  <Row label="Unidades">{r.quantity}</Row>

                  {r.kind === 'CUSTOMER' && (
                    <>
                      <Row label="Cliente">{r.customerName || '—'}</Row>
                      <Row label="Email">
                        {r.customerEmail ? (
                          <a
                            href={`mailto:${r.customerEmail}`}
                            className="text-accent underline-offset-2 hover:underline"
                          >
                            {r.customerEmail}
                          </a>
                        ) : (
                          '—'
                        )}
                      </Row>
                      <Row label="Teléfono">
                        {r.customerPhone ? (
                          <a
                            href={`tel:${r.customerPhone}`}
                            className="text-accent underline-offset-2 hover:underline"
                          >
                            {r.customerPhone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </Row>
                      <Row label="Reservado">{fmtDateTime(r.createdAt)}</Row>
                    </>
                  )}

                  {r.kind === 'BLOCK' && <Row label="Creado">{fmtDateTime(r.createdAt)}</Row>}

                  {r.notes && (
                    <div className="col-span-full mt-1">
                      <dt className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                        Notas
                      </dt>
                      <dd className="whitespace-pre-wrap rounded-sm border border-border bg-bg/40 p-3 text-[13px] text-soft">
                        {r.notes}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
