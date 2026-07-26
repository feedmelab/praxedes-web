import Link from 'next/link'

// Paginación por enlaces (servidor). Conserva otros parámetros de la query.
export default function Pagination({
  basePath,
  page,
  totalPages,
  query = {},
}: {
  basePath: string
  page: number
  totalPages: number
  query?: Record<string, string>
}) {
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const sp = new URLSearchParams(query)
    sp.set('page', String(p))
    return `${basePath}?${sp.toString()}`
  }

  const cls =
    'rounded-sm border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-soft transition-colors hover:border-accent hover:text-accent'
  const disabledCls =
    'rounded-sm border border-border/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-muted/40'

  return (
    <nav className="mt-6 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cls}>
          ← Anterior
        </Link>
      ) : (
        <span className={disabledCls}>← Anterior</span>
      )}
      <span className="text-[11px] uppercase tracking-[0.15em] text-muted">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={cls}>
          Siguiente →
        </Link>
      ) : (
        <span className={disabledCls}>Siguiente →</span>
      )}
    </nav>
  )
}
