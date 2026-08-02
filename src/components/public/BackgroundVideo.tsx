'use client'

import { useEffect, useRef } from 'react'

// Vídeo de fondo con autoplay endurecido para iOS Safari, que es muy estricto:
// requiere `muted` como PROPIEDAD (no solo atributo), `playsInline` y a menudo
// un `play()` explícito; y puede pausarlo al volver de segundo plano. Fija todo
// eso y reintenta al montar, al primer toque y al volver a primer plano.
export default function BackgroundVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    v.defaultMuted = true
    v.setAttribute('muted', '')
    v.setAttribute('webkit-playsinline', 'true')

    const tryPlay = () => {
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    tryPlay()

    const onGesture = () => tryPlay()
    const onVis = () => {
      if (document.visibilityState === 'visible') tryPlay()
    }
    window.addEventListener('touchstart', onGesture, { once: true, passive: true })
    window.addEventListener('pointerdown', onGesture, { once: true })
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('touchstart', onGesture)
      window.removeEventListener('pointerdown', onGesture)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [src])

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={className}
    />
  )
}
