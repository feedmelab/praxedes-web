'use client'

import { useTransition } from 'react'
import { toggleAvailable, deleteRentalItem } from '../actions'

export default function RentalActions({ id, available }: { id: string; available: boolean }) {
  const [pending, startTransition] = useTransition()

  function confirmDelete() {
    if (confirm('¿Borrar esta pieza y sus imágenes? Esta acción no se puede deshacer.')) {
      startTransition(() => deleteRentalItem(id))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleAvailable(id, !available))}
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-soft disabled:opacity-40"
      >
        <span
          className={`relative h-4 w-7 rounded-full transition-colors ${
            available ? 'bg-accent' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-bg transition-all ${
              available ? 'left-3.5' : 'left-0.5'
            }`}
          />
        </span>
        Disponible
      </button>
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
