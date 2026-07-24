'use client'

import { useCallback, useEffect } from 'react'
import Image from 'next/image'

export type LightboxItem = { url: string; alt?: string; caption?: string }

// Visor a pantalla completa para ampliar imágenes. Navegación con ←/→, cierre
// con Esc o clic en el fondo. Respeta la protección (sin clic derecho/arrastre
// vía MediaProtection global + no-descarga).
export default function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: LightboxItem[]
  index: number | null
  onClose: () => void
  onIndex: (i: number) => void
}) {
  const open = index !== null
  const current = open ? items[index] : null

  const go = useCallback(
    (delta: number) => {
      if (index === null) return
      const next = (index + delta + items.length) % items.length
      onIndex(next)
    },
    [index, items.length, onIndex]
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    // Bloquea el scroll del fondo mientras está abierto.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, go, onClose])

  if (!open || !current) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Cerrar */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-5 top-5 z-[2] text-2xl text-soft transition-colors hover:text-accent"
      >
        ✕
      </button>

      {/* Anterior / siguiente */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            aria-label="Anterior"
            className="absolute left-3 z-[2] px-4 py-3 text-3xl text-soft transition-colors hover:text-accent sm:left-6"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            aria-label="Siguiente"
            className="absolute right-3 z-[2] px-4 py-3 text-3xl text-soft transition-colors hover:text-accent sm:right-6"
          >
            ›
          </button>
        </>
      )}

      {/* Imagen */}
      <div
        className="relative flex max-h-[88vh] max-w-[92vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={current.url}
          alt={current.alt ?? ''}
          width={1600}
          height={1000}
          sizes="92vw"
          className="h-auto max-h-[88vh] w-auto object-contain"
        />
        {current.caption && (
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.7rem] uppercase tracking-[0.16em] text-muted">
            {current.caption}
          </span>
        )}
      </div>

      {items.length > 1 && (
        <span className="absolute bottom-5 left-1/2 z-[2] -translate-x-1/2 font-mono text-[0.7rem] text-muted">
          {index! + 1} / {items.length}
        </span>
      )}
    </div>
  )
}
