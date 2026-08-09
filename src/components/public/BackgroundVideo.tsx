'use client'

import { useEffect, useRef } from 'react'

// Vídeo de fondo con autoplay endurecido para iOS Safari, que es muy estricto:
// requiere `muted` como PROPIEDAD (no solo atributo), `playsInline` y a menudo
// un `play()` explícito; y puede pausarlo al volver de segundo plano. Fija todo
// eso y reintenta al montar, al primer toque y al volver a primer plano.
// Deduce el type MIME a partir de la extensión (ayuda a iOS a decidir).
function videoType(src: string): string {
  const m = src.toLowerCase().match(/\.(mp4|webm|mov|m4v)(\?|$)/)
  const ext = m?.[1]
  if (ext === 'webm') return 'video/webm'
  if (ext === 'mov') return 'video/quicktime'
  return 'video/mp4' // mp4 y m4v
}

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
    // iOS a veces no arranca hasta un load() explícito de la <source>.
    try {
      v.load()
    } catch {
      /* noop */
    }
    tryPlay()
    // Reintentos escalonados por si el vídeo aún no está listo (p. ej. ImageKit
    // transcodificando la primera vez): varios cortes + al estar disponible.
    const timers = [200, 500, 1000, 2000, 4000].map((ms) => setTimeout(tryPlay, ms))

    const onGesture = () => tryPlay()
    const onVis = () => {
      if (document.visibilityState === 'visible') tryPlay()
    }
    // En cuanto el navegador tiene datos suficientes, arranca.
    v.addEventListener('loadeddata', tryPlay)
    v.addEventListener('canplay', tryPlay)
    window.addEventListener('touchstart', onGesture, { once: true, passive: true })
    window.addEventListener('pointerdown', onGesture, { once: true })
    document.addEventListener('visibilitychange', onVis)
    return () => {
      timers.forEach(clearTimeout)
      v.removeEventListener('loadeddata', tryPlay)
      v.removeEventListener('canplay', tryPlay)
      window.removeEventListener('touchstart', onGesture)
      window.removeEventListener('pointerdown', onGesture)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [src])

  return (
    <video ref={ref} autoPlay muted loop playsInline preload="auto" className={className}>
      {/* La <source> con type explícito ayuda a iOS a decidir reproducir. */}
      <source src={src} type={videoType(src)} />
    </video>
  )
}
