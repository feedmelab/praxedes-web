'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card, Badge } from '../../_components/ui'
import Pagination from '../../_components/Pagination'
import {
  cancelReservation,
  confirmReservation,
  reconfirmReservation,
  deleteReservation,
  createBlock,
  cancelGroup,
  resolveGroup,
} from '../actions'

type Tab = 'requests' | 'upcoming' | 'past' | 'cancelled'
const BASE = '/admin/rental/reservations'

type Reservation = {
  id: string
  itemId: string
  itemName: string
  startDate: string
  endDate: string
  quantity: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  kind: 'CUSTOMER' | 'BLOCK'
  groupId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  notes: string | null
  createdAt: string
}

type ItemOption = { id: string; name: string; stock: number }

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
  tab,
  page,
  totalPages,
  pendingCount,
}: {
  reservations: Reservation[]
  items: ItemOption[]
  tab: Tab
  page: number
  totalPages: number
  pendingCount: number
}) {
  const [pending, startTransition] = useTransition()
  const [blockState, setBlockState] = useState<{ error?: string; ok?: boolean } | null>(null)
  // Selección para disponibilidad parcial (por id de reserva; sin marcar = confirmar).
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const isChecked = (id: string) => sel[id] !== false

  const today = new Date().toISOString().slice(0, 10)
  const filtered = reservations

  function onConfirm(id: string) {
    startTransition(() => confirmReservation(id))
  }
  function onCancel(id: string) {
    startTransition(() => cancelReservation(id))
  }
  function onReconfirm(id: string) {
    startTransition(async () => {
      const res = await reconfirmReservation(id)
      if (res?.error) alert(res.error)
    })
  }
  function onDelete(id: string) {
    startTransition(() => deleteReservation(id))
  }
  function onCancelGroup(groupId: string) {
    if (!confirm('¿Rechazar/cancelar TODA la petición (todas sus prendas)?')) return
    startTransition(() => cancelGroup(groupId))
  }
  function onResolveGroup(groupId: string, rows: Reservation[]) {
    const pend = rows.filter((r) => r.status === 'PENDING')
    const confirmIds = pend.filter((r) => isChecked(r.id)).map((r) => r.id)
    const rejectN = pend.length - confirmIds.length
    if (
      !confirm(
        `Confirmar ${confirmIds.length} prenda(s) y rechazar ${rejectN}. Se enviará UN email al cliente con el resumen. ¿Continuar?`
      )
    )
      return
    startTransition(() => resolveGroup(groupId, confirmIds))
  }

  // Nº de prendas por petición dentro de la página actual (para el badge).
  const groupCounts = reservations.reduce<Record<string, number>>((acc, r) => {
    if (r.groupId) acc[r.groupId] = (acc[r.groupId] ?? 0) + 1
    return acc
  }, {})
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

  // Agrupa por petición (mismo groupId con >1 prenda); el resto van sueltas.
  type Entry =
    { type: 'single'; r: Reservation } | { type: 'group'; groupId: string; rows: Reservation[] }
  const seen = new Set<string>()
  const entries: Entry[] = []
  for (const r of filtered) {
    if (r.groupId && groupCounts[r.groupId] > 1) {
      if (seen.has(r.groupId)) continue
      seen.add(r.groupId)
      entries.push({
        type: 'group',
        groupId: r.groupId,
        rows: filtered.filter((x) => x.groupId === r.groupId),
      })
    } else {
      entries.push({ type: 'single', r })
    }
  }

  function renderGroup(groupId: string, rows: Reservation[]) {
    const head = rows[0]
    const n = nights(head.startDate, head.endDate)
    const anyPending = rows.some((r) => r.status === 'PENDING')
    const allCancelled = rows.every((r) => r.status === 'CANCELLED')
    return (
      <div
        key={`g-${groupId}`}
        className={`rounded border bg-surface p-5 ${allCancelled ? 'border-border opacity-60' : 'border-accent/40'}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl text-light">
              Petición · {rows.length} prendas
            </span>
            <Badge tone="muted">#{groupId.slice(0, 6)}</Badge>
            {anyPending && <Badge tone="accent">Pendiente</Badge>}
            {allCancelled && <Badge tone="red">Cancelada</Badge>}
          </div>
          {anyPending && (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => onCancelGroup(groupId)}
                className="rounded-sm border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-soft transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-40"
              >
                Rechazar petición
              </button>
            </div>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 border-t border-border pt-4 sm:grid-cols-[auto_1fr_auto_1fr]">
          <Row label="Recogida">{fmtLong(head.startDate)}</Row>
          <Row label="Devolución">{fmtLong(head.endDate)}</Row>
          <Row label="Duración">
            {n} {n === 1 ? 'noche' : 'noches'}
          </Row>
          <Row label="Cliente">{head.customerName || '—'}</Row>
          <Row label="Email">
            {head.customerEmail ? (
              <a
                href={`mailto:${head.customerEmail}`}
                className="text-accent underline-offset-2 hover:underline"
              >
                {head.customerEmail}
              </a>
            ) : (
              '—'
            )}
          </Row>
          <Row label="Teléfono">
            {head.customerPhone ? (
              <a
                href={`tel:${head.customerPhone}`}
                className="text-accent underline-offset-2 hover:underline"
              >
                {head.customerPhone}
              </a>
            ) : (
              '—'
            )}
          </Row>
          <Row label="Reservado">{fmtDateTime(head.createdAt)}</Row>
        </dl>
        {head.notes && (
          <div className="mt-3">
            <dt className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted">Notas</dt>
            <dd className="whitespace-pre-wrap rounded-sm border border-border bg-bg/40 p-3 text-[13px] text-soft">
              {head.notes}
            </dd>
          </div>
        )}

        {/* Prendas de la petición */}
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {r.status === 'PENDING' && (
                  <input
                    type="checkbox"
                    checked={isChecked(r.id)}
                    onChange={(e) => setSel((s) => ({ ...s, [r.id]: e.currentTarget.checked }))}
                    className="h-3.5 w-3.5 accent-accent"
                    title="Confirmar esta prenda"
                  />
                )}
                <span className="text-light">{r.itemName}</span>
                <span className="text-[11px] text-muted">× {r.quantity}</span>
                {r.status === 'PENDING' && <Badge tone="accent">Pendiente</Badge>}
                {r.status === 'CONFIRMED' && <Badge tone="muted">Confirmada</Badge>}
                {r.status === 'CANCELLED' && <Badge tone="red">Cancelada</Badge>}
              </div>
              <div className="flex shrink-0 gap-2">
                {r.status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onConfirm(r.id)}
                    className="rounded-sm border border-accent px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-accent hover:bg-accent/10 disabled:opacity-40"
                  >
                    Confirmar
                  </button>
                )}
                {(r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onCancel(r.id)}
                    className="rounded-sm border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-soft hover:border-accent hover:text-accent disabled:opacity-40"
                  >
                    {r.status === 'PENDING' ? 'Rechazar' : 'Cancelar'}
                  </button>
                )}
                {r.status === 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onReconfirm(r.id)}
                    className="rounded-sm border border-accent px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-accent hover:bg-accent/10 disabled:opacity-40"
                  >
                    Reactivar
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onDelete(r.id)}
                  className="rounded-sm border border-red-500/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>

        {anyPending && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-[11px] text-muted">
              Disponibilidad parcial: marca las prendas que confirmas; las demás se rechazan y se
              avisa al cliente con un solo email.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => onResolveGroup(groupId, rows)}
              className="rounded-sm border border-accent px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
            >
              Confirmar selección y avisar
            </button>
          </div>
        )}
      </div>
    )
  }

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

      {/* Filtros (navegan por URL; el filtrado y la paginación son de servidor) */}
      <div className="flex flex-wrap gap-2">
        <Link href={`${BASE}?tab=requests`} className={tabBtn(tab === 'requests')}>
          Solicitudes{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </Link>
        <Link href={`${BASE}?tab=upcoming`} className={tabBtn(tab === 'upcoming')}>
          Próximas
        </Link>
        <Link href={`${BASE}?tab=past`} className={tabBtn(tab === 'past')}>
          Pasadas
        </Link>
        <Link href={`${BASE}?tab=cancelled`} className={tabBtn(tab === 'cancelled')}>
          Canceladas
        </Link>
      </div>

      {/* Lista */}
      {entries.length === 0 ? (
        <p className="text-sm text-muted">No hay reservas en esta vista.</p>
      ) : (
        <div className="space-y-4">
          {entries.map((e) => {
            if (e.type === 'group') return renderGroup(e.groupId, e.rows)
            const r = e.r
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
                    {r.status === 'PENDING' && <Badge tone="accent">Pendiente</Badge>}
                    {r.status === 'CANCELLED' && <Badge tone="red">Cancelada</Badge>}
                    {r.groupId && (
                      <Badge tone="muted">
                        Petición #{r.groupId.slice(0, 6)}
                        {groupCounts[r.groupId] > 1 ? ` · ${groupCounts[r.groupId]} prendas` : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {r.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onConfirm(r.id)}
                        className="rounded-sm bg-accent px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-bg transition-all hover:bg-accent/90 disabled:opacity-40"
                      >
                        Confirmar
                      </button>
                    )}
                    {(r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onCancel(r.id)}
                        className="rounded-sm border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                      >
                        {r.status === 'PENDING' ? 'Rechazar' : 'Cancelar'}
                      </button>
                    )}
                    {r.status === 'CANCELLED' && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onReconfirm(r.id)}
                        className="rounded-sm border border-accent px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
                      >
                        Reactivar
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

      <Pagination basePath={BASE} page={page} totalPages={totalPages} query={{ tab }} />
    </div>
  )
}
