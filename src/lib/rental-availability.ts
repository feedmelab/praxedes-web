// Lógica de disponibilidad de alquiler. Funciones puras (sin DB) para poder
// testearlas y reutilizarlas en cliente y servidor.

export type DateRange = { start: Date; end: Date }

// Días de margen para limpieza/preparación entre una devolución y la siguiente
// recogida. Con 1, tras devolver el día X la pieza no vuelve a estar disponible
// hasta X+1 (el día X queda reservado para limpieza).
export const BUFFER_DAYS = 1

/** Normaliza una fecha a medianoche UTC (tratamos las fechas como días). */
export function toDay(d: Date | string): Date {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/** Suma (o resta) días naturales a una fecha. */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000)
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
 *
 * `bufferDays` añade un margen de limpieza: se extiende el fin tanto de las
 * reservas existentes como del rango solicitado, de modo que quede al menos
 * ese número de días libres entre una devolución y la siguiente recogida.
 */
export function freeUnits(
  stock: number,
  range: DateRange,
  reservations: Array<{ startDate: Date; endDate: Date; quantity: number }>,
  bufferDays = 0
): number {
  const q = bufferDays ? { start: range.start, end: addDays(range.end, bufferDays) } : range
  const used = reservations.reduce((sum, r) => {
    const rr = { start: toDay(r.startDate), end: addDays(toDay(r.endDate), bufferDays) }
    return rangesOverlap(q, rr) ? sum + r.quantity : sum
  }, 0)
  return stock - used
}

/** Número de noches del rango (para mostrar/validar). */
export function nights(start: Date, end: Date): number {
  return Math.round((toDay(end).getTime() - toDay(start).getTime()) / 86_400_000)
}

/**
 * Unidades libres HOY (rango [hoy, mañana)). Sirve para marcar en el catálogo
 * las piezas agotadas en este momento.
 */
export function freeToday(
  stock: number,
  reservations: Array<{ startDate: Date; endDate: Date; quantity: number }>
): number {
  const start = toDay(new Date())
  const end = new Date(start.getTime() + 86_400_000)
  return freeUnits(stock, { start, end }, reservations)
}

const isoDay = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`

/**
 * Primer día (desde hoy) con al menos una unidad libre. Devuelve 'YYYY-MM-DD',
 * o null si no hay hueco en el horizonte. Útil para "Disponible a partir del…"
 * en piezas agotadas ahora mismo.
 */
export function nextAvailableDay(
  stock: number,
  reservations: Array<{ startDate: Date; endDate: Date; quantity: number }>,
  horizonDays = 400
): string | null {
  const start = toDay(new Date())
  for (let i = 0; i < horizonDays; i++) {
    const day = addDays(start, i)
    const free = freeUnits(stock, { start: day, end: addDays(day, 1) }, reservations)
    if (free >= 1) return isoDay(day)
  }
  return null
}
