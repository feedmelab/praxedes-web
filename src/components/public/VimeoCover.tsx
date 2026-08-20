'use client'

import { useEffect, useRef, useState } from 'react'
import { parseVimeo } from '@/lib/utils'

// Vídeo de Vimeo en modo «background» (bucle, silenciado, sin controles ni
// vídeos sugeridos) que CUBRE su contenedor sea cual sea su proporción, usando
// unidades de container query. El contenedor debe tener `container-type: size`.
// No captura el ratón. El iframe permanece montado y se pausa/reanuda (sin
// reiniciar) según entre o salga del viewport, vía la API de Vimeo. Para evitar
// el destello blanco, la imagen-poster se mantiene encima hasta que reproduce.
export default function VimeoCover({
  vimeoId,
  poster,
  className = '',
}: {
  vimeoId: string
  poster?: string | null
  className?: string
}) {
  const { id, hash } = parseVimeo(vimeoId)
  const wrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playing = useRef(true) // parte de «reproduciendo» (autoplay)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    const ifr = iframeRef.current
    if (!wrap || !ifr) return
    const post = (method: 'play' | 'pause') =>
      ifr.contentWindow?.postMessage(JSON.stringify({ method }), '*')
    const io = new IntersectionObserver(
      ([e]) => {
        // Solo actuar en cambios reales; no cortar el autoplay inicial.
        if (e.isIntersecting === playing.current) return
        playing.current = e.isIntersecting
        post(e.isIntersecting ? 'play' : 'pause')
      },
      { threshold: 0.35 }
    )
    io.observe(wrap)
    return () => io.disconnect()
  }, [])

  if (!id) return null
  const src = `https://player.vimeo.com/video/${id}?${hash ? `h=${hash}&` : ''}background=1&autoplay=1&muted=1&loop=1&dnt=1`

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <iframe
        ref={iframeRef}
        src={src}
        title=""
        aria-hidden
        allow="autoplay; fullscreen"
        onLoad={() => setTimeout(() => setReady(true), 900)}
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0 bg-black ${className}`}
        style={{ width: 'max(100cqw, 177.78cqh)', height: 'max(56.25cqw, 100cqh)' }}
      />
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            ready ? 'opacity-0' : 'opacity-100'
          } ${className}`}
        />
      )}
    </div>
  )
}
