'use client'

import { useEffect, useRef, useState } from 'react'

type Imgs = {
  center: string
  top?: string | null
  bottom?: string | null
  left?: string | null
  right?: string | null
}

const isVideo = (src: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)

function Media({
  src,
  alt = '',
  style,
}: {
  src: string
  alt?: string
  style?: React.CSSProperties
}) {
  const cls = 'absolute inset-0 h-full w-full object-cover'
  return isVideo(src) ? (
    <video src={src} className={cls} style={style} autoPlay muted loop playsInline />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={cls} style={style} />
  )
}

// Las fotos van pasando solas, de vez en cuando, con un cross-dissolve de
// opacidad auténtico y sutil. La entrante se funde por encima de la anterior
// (que queda opaca debajo), así nunca se ve el fondo. Con «reduce motion» queda
// fija en la primera.
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
  const [baseSrc, setBaseSrc] = useState(pics[0] ?? '')
  const [trans, setTrans] = useState<{ src: string; dur: number } | null>(null)
  const [on, setOn] = useState(false) // dispara el fundido de la capa entrante
  const layerRef = useRef<HTMLDivElement>(null)

  // Programa la próxima transición cuando la base está asentada.
  useEffect(() => {
    if (reduce || pics.length < 2 || trans) return
    const delay = 4500 + Math.random() * 4000
    const id = setTimeout(() => {
      const others = pics.filter((p) => p !== baseSrc)
      const next = others[Math.floor(Math.random() * others.length)]
      setOn(false)
      setTrans({ src: next, dur: 2200 + Math.random() * 1400 }) // 2.2–3.6 s, sutil
    }, delay)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSrc, reduce, pics.length, trans])

  // Arranca el fundido en el frame siguiente al montar la capa entrante.
  useEffect(() => {
    if (!trans) return
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)))
    return () => cancelAnimationFrame(raf)
  }, [trans])

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Base: imagen asentada, siempre visible debajo. */}
      <Media src={baseSrc} alt="Sobre mí" />

      {/* Entrante: se funde por encima; al terminar, pasa a ser la base. */}
      {trans && (
        <div
          ref={layerRef}
          className="absolute inset-0"
          style={{
            opacity: on ? 1 : 0,
            transition: `opacity ${trans.dur}ms ease-in-out`,
            willChange: 'opacity',
          }}
          onTransitionEnd={(e) => {
            if (e.propertyName !== 'opacity') return
            setBaseSrc(trans.src)
            setTrans(null)
            setOn(false)
          }}
        >
          <Media src={trans.src} />
        </div>
      )}

      {/* Viñeta interior para dar profundidad. */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,.5)' }}
      />
    </div>
  )
}
