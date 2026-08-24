'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Reveal from './Reveal'
import Lightbox from './Lightbox'
import VimeoEmbed from './VimeoEmbed'
import { focalClass, type Focal } from '@/lib/focal'

type MediaItem = {
  id: string
  kind: 'IMAGE' | 'VIDEO'
  url: string | null
  vimeoId: string | null
  wide: boolean
  focal: Focal
  altEs: string | null
  altEn: string | null
}

// Galería del proyecto: mezcla imágenes (foto subida o fotograma extraído) y
// vídeos de Vimeo. Las imágenes se amplían en un visor; los vídeos se embeben.
export default function ProjectGallery({
  images,
  locale,
  letterbox = true,
}: {
  images: MediaItem[]
  locale: 'es' | 'en'
  /** Recortar franjas negras (fotograma) en las miniaturas. El visor no recorta. */
  letterbox?: boolean
}) {
  const [open, setOpen] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)

  const PER_PAGE = 8
  const paged = images.length > PER_PAGE
  const pages = paged ? Math.ceil(images.length / PER_PAGE) : 1
  const shown = paged ? images.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE) : images

  function goTo(p: number) {
    const next = Math.max(0, Math.min(pages - 1, p))
    setPage(next)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Paginador minimalista, alineado a la derecha (se usa arriba y abajo).
  function pager() {
    if (!paged) return null
    return (
      <nav className="flex items-center justify-end gap-5 text-[0.7rem] uppercase tracking-[0.24em] text-muted">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page === 0}
          aria-label="Anterior"
          className="transition-colors hover:text-accent disabled:pointer-events-none disabled:opacity-25"
        >
          ←
        </button>
        <div className="flex items-center gap-4 tabular-nums">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === page ? 'page' : undefined}
              className={`pb-0.5 transition-colors ${
                i === page ? 'border-b border-accent text-accent' : 'text-muted hover:text-light'
              }`}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page === pages - 1}
          aria-label="Siguiente"
          className="transition-colors hover:text-accent disabled:pointer-events-none disabled:opacity-25"
        >
          →
        </button>
      </nav>
    )
  }

  if (images.length === 0) return null

  // Solo las imágenes entran en el visor; guardamos el índice de lightbox.
  const lightboxItems: { url: string; alt: string }[] = []
  const lightboxIndex = new Map<string, number>()
  images.forEach((m) => {
    if (m.kind === 'IMAGE' && m.url) {
      lightboxIndex.set(m.id, lightboxItems.length)
      lightboxItems.push({ url: m.url, alt: (locale === 'en' ? m.altEn : m.altEs) ?? '' })
    }
  })

  return (
    <>
      <div ref={topRef} className="scroll-mt-28" />
      {paged && <div className="mb-6">{pager()}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-6">
        {shown.map((m, i) => {
          const wide = m.wide
          const spanClass = wide ? 'sm:col-span-2' : ''

          if (m.kind === 'VIDEO' && m.vimeoId) {
            return (
              <Reveal
                key={m.id}
                delay={(i % 2) * 60}
                className={`relative aspect-video overflow-hidden bg-black ${spanClass}`}
              >
                <VimeoEmbed vimeoId={m.vimeoId} />
              </Reveal>
            )
          }

          const alt = (locale === 'en' ? m.altEn : m.altEs) ?? ''
          const idx = lightboxIndex.get(m.id) ?? 0
          return (
            <Reveal
              key={m.id}
              delay={(i % 2) * 60}
              className={`group relative cursor-zoom-in overflow-hidden border border-border ${
                wide ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[4/5]'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(idx)}
                aria-label={alt || 'Ampliar imagen'}
                className="absolute inset-0 z-[3]"
              />
              {m.url && (
                <Image
                  src={m.url}
                  alt={alt}
                  fill
                  sizes={wide ? '100vw' : '(max-width: 640px) 100vw, 50vw'}
                  className={`object-cover ${focalClass(m.focal)} brightness-[0.85] transition-all duration-700 ease-out-expo group-hover:brightness-100 ${
                    letterbox ? 'scale-[1.38] group-hover:scale-[1.42]' : 'group-hover:scale-[1.03]'
                  }`}
                />
              )}
            </Reveal>
          )
        })}
      </div>

      {paged && <div className="mt-10 lg:mt-14">{pager()}</div>}

      <Lightbox
        items={lightboxItems}
        index={open}
        onClose={() => setOpen(null)}
        onIndex={setOpen}
      />
    </>
  )
}
