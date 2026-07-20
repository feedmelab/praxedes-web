import Link from 'next/link'
import { cn } from '@/lib/utils'

/* ── Cabecera de página ──────────────────────────────────────── */

export function PageHeader({
  title,
  back,
  children,
}: {
  title: string
  back?: { href: string; label: string }
  children?: React.ReactNode
}) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-block text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-3xl tracking-wide text-light">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  )
}

/* ── Campo con etiqueta ──────────────────────────────────────── */

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-light ' +
  'transition-colors placeholder:text-muted focus:border-accent focus:outline-none'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, 'min-h-[7rem] resize-y', props.className)} />
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, 'cursor-pointer', props.className)} />
}

/* ── Contenedor tipo tarjeta ─────────────────────────────────── */

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded border border-border bg-surface p-6', className)}>{children}</div>
  )
}

/* ── Etiqueta de estado ──────────────────────────────────────── */

export function Badge({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode
  tone?: 'muted' | 'accent' | 'green' | 'red'
}) {
  const tones = {
    muted: 'border-border text-muted',
    accent: 'border-accent/50 text-accent',
    green: 'border-green-500/40 text-green-400',
    red: 'border-red-500/40 text-red-400',
  }
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider',
        tones[tone]
      )}
    >
      {children}
    </span>
  )
}

/* ── Enlace con estilo de botón ──────────────────────────────── */

export function ButtonLink({
  href,
  children,
  variant = 'outline',
}: {
  href: string
  children: React.ReactNode
  variant?: 'outline' | 'solid'
}) {
  const styles =
    variant === 'solid'
      ? 'bg-accent text-bg hover:bg-accent/90'
      : 'border border-accent/50 text-accent hover:bg-accent hover:text-bg'
  return (
    <Link
      href={href}
      className={cn(
        'rounded-sm px-4 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300',
        styles
      )}
    >
      {children}
    </Link>
  )
}
