'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatTimecode } from '@/lib/utils'
import Reveal from './Reveal'
import Lightbox from './Lightbox'

type Frame = {
  id: string
  url: string
  timecode: number
  labelEs: string | null
  labelEn: string | null
  width: number
  height: number
}

// "Frames destacados": capturas extraídas del vídeo (herramienta del módulo B)
// que muestran el vestuario en contexto. Al pulsar, se amplían en un visor.
export default function FramesGrid({ frames, locale }: { frames: Frame[]; locale: 'es' | 'en' }) {
  const [open, setOpen] = useState<number | null>(null)
  if (frames.length === 0) return null

  const items = frames.map((f) => {
    const label = locale === 'en' ? f.labelEn : f.labelEs
    return {
      url: f.url,
      alt: label ?? '',
      caption: [formatTimecode(f.timecode), label].filter(Boolean).join(' · '),
    }
  })

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
        {frames.map((f, i) => {
          const label = locale === 'en' ? f.labelEn : f.labelEs
          return (
            <Reveal
              key={f.id}
              delay={(i % 3) * 60}
              className="group relative aspect-video cursor-zoom-in overflow-hidden border border-border"
            >
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={label ?? 'Ampliar fotograma'}
                className="absolute inset-0 z-[3]"
              />
              <Image
                src={f.url}
                alt={label ?? ''}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover brightness-[0.82] transition-all duration-700 ease-out-expo group-hover:brightness-100"
              />
              <span className="absolute left-2 top-2 z-[2] border border-border bg-bg/60 px-[0.45rem] py-[0.2rem] font-mono text-[0.6rem] tracking-[0.08em] text-light backdrop-blur-sm">
                {formatTimecode(f.timecode)}
              </span>
              {label && (
                <span className="duration-400 absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-bg/80 to-transparent p-3 text-[0.64rem] uppercase tracking-[0.16em] text-soft opacity-0 transition-all ease-out-expo group-hover:opacity-100">
                  {label}
                </span>
              )}
            </Reveal>
          )
        })}
      </div>

      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  )
}
