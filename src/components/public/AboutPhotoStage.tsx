'use client'

import { useEffect, useState } from 'react'
import BackgroundVideo from './BackgroundVideo'

type Imgs = {
  center: string
  top?: string | null
  bottom?: string | null
  left?: string | null
  right?: string | null
}

const isVideo = (src: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)

function Media({ src, alt = '' }: { src: string; alt?: string }) {
  const cls = 'h-full w-full object-cover'
  return isVideo(src) ? (
    <BackgroundVideo src={src} className={cls} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={cls} />
  )
}

// Cross-dissolve auténtico y sutil entre fotos y/o vídeos. Todas las capas se
// montan UNA vez y permanecen (los vídeos siguen reproduciéndose de fondo), así
// nunca aparecen en negro por recargarse en cada transición. Solo se cruza la
// opacidad: la entrante (cur) se funde por encima de la anterior (prev), que
// queda opaca debajo hasta terminar. Con «reduce motion» queda fija en la
// primera.
export default function AboutPhotoStage({ images }: { images: Imgs }) {
  const pics = Array.from(
    new Set(
      [images.center, images.top, images.bottom, images.left, images.right].filter(
        (s): s is string => !!s
      )
    )
  )

  const [reduce] = useState(
    () =>
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [cur, setCur] = useState(0)
  const [prev, setPrev] = useState(0)

  useEffect(() => {
    if (reduce || pics.length < 2) return
    const delay = 4500 + Math.random() * 4000
    const id = setTimeout(() => {
      setPrev(cur)
      setCur((c) => {
        let n = c
        while (n === c) n = Math.floor(Math.random() * pics.length)
        return n
      })
    }, delay)
    return () => clearTimeout(id)
  }, [cur, reduce, pics.length])

  return (
    <div className="relative h-full w-full overflow-hidden">
      {pics.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0"
          style={{
            opacity: i === cur || i === prev ? 1 : 0,
            zIndex: i === cur ? 2 : i === prev ? 1 : 0,
            transition: 'opacity 1800ms ease-in-out',
            willChange: 'opacity',
          }}
        >
          <Media src={src} alt={i === 0 ? 'Sobre mí' : ''} />
        </div>
      ))}

      {/* Viñeta interior para dar profundidad. */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,.5)' }}
      />
    </div>
  )
}
