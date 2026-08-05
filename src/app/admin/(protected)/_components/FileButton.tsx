'use client'

// Control de subida unificado: un botón con «+» que abre el selector de
// archivos, con un icono en la esquina que indica el tipo aceptado (imagen /
// vídeo / todos). Dos modos:
//  - controlado: pasa `onChange` (p. ej. subidas directas a ImageKit).
//  - formulario: pasa `name` (+ `autoSubmit` para enviar al elegir archivo).

export type Kind = 'all' | 'image' | 'video'

export function kindFromAccept(accept?: string): Kind {
  const a = (accept ?? '').toLowerCase()
  const img = a.includes('image')
  const vid = a.includes('video')
  if (img && vid) return 'all'
  if (vid) return 'video'
  return 'image'
}

export function KindIcon({ kind, className }: { kind: Kind; className?: string }) {
  if (kind === 'video')
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M15 10l6-3v10l-6-3v-4z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )
  if (kind === 'image')
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="8.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M4 17l5-4 4 3 3-2 4 3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="5" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15 8.5l5-2.5v9l-5-2.5v-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 19h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function FileButton({
  name,
  accept,
  caption = 'Añadir',
  onChange,
  autoSubmit,
  required,
  disabled,
  busy,
  showType = true,
  className = '',
}: {
  name?: string
  accept?: string
  caption?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  autoSubmit?: boolean
  required?: boolean
  disabled?: boolean
  busy?: boolean
  showType?: boolean
  className?: string
}) {
  const kind = kindFromAccept(accept)

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    if (onChange) {
      onChange(e)
      return
    }
    if (autoSubmit && e.currentTarget.files?.length) e.currentTarget.form?.requestSubmit()
  }

  return (
    <label
      className={`relative flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-bg/40 px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent/60 hover:text-accent ${
        disabled || busy ? 'pointer-events-none opacity-40' : ''
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span>{busy ? 'Subiendo…' : caption}</span>
      {showType && (
        <span className="absolute right-1.5 top-1.5 text-muted/70">
          <KindIcon kind={kind} className="h-3.5 w-3.5" />
        </span>
      )}
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        disabled={disabled || busy}
        onChange={handle}
        className="hidden"
      />
    </label>
  )
}
