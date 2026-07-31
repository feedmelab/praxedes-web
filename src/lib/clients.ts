// Utilidades para la sección "Clientes seleccionados".

// Nº máximo de clientes que se muestran a la vez en la home / sobre mí.
export const CLIENTS_LIMIT = 12

// Lista de respaldo: se muestra solo si aún no hay proyectos publicados ni lista
// curada (los clientes reales salen del campo `client` de cada proyecto).
export const CLIENTS_FALLBACK = [
  'Lamborghini',
  'Jeep',
  'Nissan',
  'Citroën',
  'Nike',
  'Decathlon',
  'Nestlé',
  'Schweppes',
  'Coca-Cola',
]

// Parte una lista curada (uno por línea o separados por comas) en nombres
// únicos y limpios.
export function parseClients(text?: string | null): string[] {
  if (!text) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of text.split(/[\n,]/)) {
    const c = raw.trim()
    if (c && !seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase())
      out.push(c)
    }
  }
  return out
}
