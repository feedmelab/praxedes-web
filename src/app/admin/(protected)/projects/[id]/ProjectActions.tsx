'use client'

import { useTransition } from 'react'
import { togglePublished, toggleFeatured, deleteProject } from '../actions'

function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-soft disabled:opacity-40"
    >
      <span
        className={`relative h-4 w-7 rounded-full transition-colors ${
          value ? 'bg-accent' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-bg transition-all ${
            value ? 'left-3.5' : 'left-0.5'
          }`}
        />
      </span>
      {label}
    </button>
  )
}

export default function ProjectActions({
  id,
  published,
  featured,
}: {
  id: string
  published: boolean
  featured: boolean
}) {
  const [pending, startTransition] = useTransition()

  function confirmDelete() {
    if (confirm('¿Borrar este proyecto y todas sus imágenes? Esta acción no se puede deshacer.')) {
      startTransition(() => deleteProject(id))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Toggle
        label="Publicado"
        value={published}
        disabled={pending}
        onChange={(v) => startTransition(() => togglePublished(id, v))}
      />
      <Toggle
        label="Destacado"
        value={featured}
        disabled={pending}
        onChange={(v) => startTransition(() => toggleFeatured(id, v))}
      />
      <button
        type="button"
        disabled={pending}
        onClick={confirmDelete}
        className="text-[11px] uppercase tracking-[0.15em] text-red-400 transition-colors hover:text-red-300 disabled:opacity-40"
      >
        Borrar
      </button>
    </div>
  )
}
