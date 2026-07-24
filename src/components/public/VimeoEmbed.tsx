'use client'

import { useState } from 'react'
import { parseVimeo } from '@/lib/utils'

// Fachada de vídeo: muestra un tile negro con botón de play y solo carga el
// iframe de Vimeo al pulsar. Evita el "chrome" del póster de Vimeo (gradientes
// arriba/abajo) y es más ligero (no carga el player hasta que se usa).
export default function VimeoEmbed({ vimeoId }: { vimeoId: string }) {
  const [playing, setPlaying] = useState(false)
  const { id, hash } = parseVimeo(vimeoId)

  if (playing) {
    const src = `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0${
      hash ? `&h=${hash}` : ''
    }`
    return (
      <iframe
        src={src}
        className="absolute inset-0 block h-full w-full border-0"
        style={{ border: 0 }}
        allow="autoplay; fullscreen; picture-in-picture"
        title="Vimeo"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label="Reproducir vídeo"
      className="group absolute inset-0 flex items-center justify-center bg-black"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-light/50 transition-all duration-500 ease-out-expo group-hover:scale-110 group-hover:border-accent">
        <span
          className="ml-1 border-y-[9px] border-l-[14px] border-y-transparent border-l-light transition-colors group-hover:border-l-accent"
          aria-hidden
        />
      </span>
    </button>
  )
}
