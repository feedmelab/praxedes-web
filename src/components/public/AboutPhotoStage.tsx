'use client'

import { useEffect, useState } from 'react'

type Imgs = {
  center: string
  top?: string | null
  bottom?: string | null
  left?: string | null
  right?: string | null
}

// Las fotos van pasando solas con un fundido suave, de vez en cuando. La imagen
// entrante aparece por encima de la anterior (que permanece opaca debajo), así
// el crossfade nunca deja ver el fondo. Se detiene con «reduce motion».
export default function AboutPhotoStage({ images }: { images: Imgs }) {
  const pics = Array.from(
    new Set(
      [images.center, images.top, images.bottom, images.left, images.right].filter(
        (s): s is string => !!s
      )
    )
  )

  const [cur, setCur] = useState(0)
  const [prev, setPrev] = useState(0)

  useEffect(() => {
    if (pics.length < 2) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    // De vez en cuando: intervalo con algo de aleatoriedad.
    const delay = 5000 + Math.random() * 4000
    const id = setTimeout(() => {
      setPrev(cur)
      setCur((c) => {
        let n = c
        while (n === c) n = Math.floor(Math.random() * pics.length)
        return n
      })
    }, delay)
    return () => clearTimeout(id)
  }, [cur, pics.length])

  const isVideo = (src: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* eslint-disable @next/next/no-img-element */}
      {pics.map((src, i) => {
        const style = {
          opacity: i === cur || i === prev ? 1 : 0,
          zIndex: i === cur ? 2 : i === prev ? 1 : 0,
          transition: 'opacity 1800ms ease-in-out',
        } as const
        const cls = 'absolute inset-0 h-full w-full object-cover'
        return isVideo(src) ? (
          <video
            key={src + i}
            src={src}
            className={cls}
            style={style}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            key={src + i}
            src={src}
            alt={i === 0 ? 'Sobre mí' : ''}
            className={cls}
            style={style}
          />
        )
      })}
      {/* eslint-enable @next/next/no-img-element */}

      {/* Viñeta interior para dar profundidad. */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,.5)' }}
      />
    </div>
  )
}
