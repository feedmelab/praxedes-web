'use client'

import { useState } from 'react'
import Image from 'next/image'
import Reveal from './Reveal'
import Lightbox from './Lightbox'
import { parseVimeo } from '@/lib/utils'

type MediaItem = {
  id: string
  kind: 'IMAGE' | 'VIDEO'
  url: string | null
  vimeoId: string | null
  altEs: string | null
  altEn: string | null
}

// Galería del proyecto: mezcla imágenes (foto subida o fotograma extraído) y
// vídeos de Vimeo. Las imágenes se amplían en un visor; los vídeos se embeben.
export default function ProjectGallery({
  images,
  locale,
}: {
  images: MediaItem[]
  locale: 'es' | 'en'
}) {
  const [open, setOpen] = useState<number | null>(null)
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-6">
        {images.map((m, i) => {
          const wide = i === 0
          const spanClass = wide ? 'sm:col-span-2' : ''

          if (m.kind === 'VIDEO' && m.vimeoId) {
            const { id, hash } = parseVimeo(m.vimeoId)
            const src = `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0${hash ? `&h=${hash}` : ''}`
            return (
              <Reveal
                key={m.id}
                delay={(i % 2) * 60}
                className={`relative aspect-video overflow-hidden border border-border ${spanClass}`}
              >
                <iframe
                  src={src}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title="Vimeo"
                />
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
                  className="object-cover brightness-[0.85] transition-all duration-700 ease-out-expo group-hover:scale-[1.03] group-hover:brightness-100"
                />
              )}
            </Reveal>
          )
        })}
      </div>

      <Lightbox
        items={lightboxItems}
        index={open}
        onClose={() => setOpen(null)}
        onIndex={setOpen}
      />
    </>
  )
}
