// Lógica de disponibilidad de alquiler. Funciones puras (sin DB) para poder
// testearlas y reutilizarlas en cliente y servidor.

export type DateRange = { start: Date; end: Date }

/** Normaliza una fecha a medianoche UTC (tratamos las fechas como días). */
export function toDay(d: Date | string): Date {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * Dos rangos [aStart,aEnd) y [bStart,bEnd) solapan si aStart < bEnd && bStart < aEnd.
 * El fin es exclusivo: devolver el mismo día que otro empieza NO solapa.
 */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()
}

/** Valida que el rango sea coherente (inicio < fin y no en el pasado). */
export function isValidRange(start: Date, end: Date, today = toDay(new Date())): boolean {
  return start.getTime() >= today.getTime() && start.getTime() < end.getTime()
}

/**
 * Unidades libres de una pieza en un rango, dado su stock y las reservas
 * confirmadas que solapan. `reservations` debe traer solo las CONFIRMED del
 * item (cliente y bloqueos internos).
 */
export function freeUnits(
  stock: number,
  range: DateRange,
  reservations: Array<{ startDate: Date; endDate: Date; quantity: number }>
): number {
  const used = reservations.reduce((sum, r) => {
    const rr = { start: toDay(r.startDate), end: toDay(r.endDate) }
    return rangesOverlap(range, rr) ? sum + r.quantity : sum
  }, 0)
  return stock - used
}

/** Número de noches del rango (para mostrar/validar). */
export function nights(start: Date, end: Date): number {
  return Math.round((toDay(end).getTime() - toDay(start).getTime()) / 86_400_000)
}
