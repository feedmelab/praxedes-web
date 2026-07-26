'use client'

import { useState } from 'react'
import Image from 'next/image'
import Reveal from './Reveal'
import Lightbox from './Lightbox'

// Galería de una pieza de alquiler con visor a pantalla completa al pulsar.
export default function RentalGallery({
  images,
  name,
}: {
  images: { url: string }[]
  name: string
}) {
  const [open, setOpen] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <div
          className="col-span-2 aspect-[16/10] border border-border"
          style={{ background: 'linear-gradient(150deg,#1a1613,#241d14,#0e0c0b)' }}
        />
      </div>
    )
  }

  const items = images.map((img) => ({ url: img.url, alt: name }))

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        {images.map((img, i) => (
          <Reveal
            key={img.url}
            delay={(i % 2) * 60}
            className={`group relative cursor-zoom-in overflow-hidden border border-border ${
              i === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[3/4]'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label="Ampliar imagen"
              className="absolute inset-0 z-[3]"
            />
            <Image
              src={img.url}
              alt={name}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-top brightness-[0.9] transition-all duration-700 ease-out-expo group-hover:scale-[1.03] group-hover:brightness-100"
            />
          </Reveal>
        ))}
      </div>

      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  )
}
