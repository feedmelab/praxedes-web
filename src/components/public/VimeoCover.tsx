'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { parseVimeo } from '@/lib/utils'

// Vídeo de Vimeo en modo «background» (bucle, silenciado, sin controles ni
// vídeos sugeridos) que CUBRE su contenedor sea cual sea su proporción, usando
// unidades de container query. El contenedor debe tener `container-type: size`.
// No captura el ratón. El iframe permanece montado y se pausa/reanuda (sin
// reiniciar) según entre o salga del viewport, vía la API de Vimeo.
//
// Para EVITAR EL DESTELLO BLANCO del iframe al arrancar, la imagen-poster se
// mantiene encima y solo se retira cuando Vimeo confirma que ya está pintando
// fotogramas (evento `timeupdate`), no por un tiempo fijo.
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
  // Necesario para que el player emita eventos por postMessage (api=1). Con
  // useId es estable entre servidor y cliente (evita mismatch de hidratación).
  const pid = `vc-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    const wrap = wrapRef.current
    const ifr = iframeRef.current
    if (!wrap || !ifr) return
    const win = () => ifr.contentWindow
    const post = (obj: Record<string, unknown>) => win()?.postMessage(JSON.stringify(obj), '*')

    // Eventos del player de Vimeo: al estar listo, escuchamos `timeupdate`;
    // cuando avanza (>0 s) el vídeo ya se ve → retiramos el poster.
    const onMsg = (e: MessageEvent) => {
      if (e.source !== win()) return
      let d: { event?: string; data?: { seconds?: number } } | null = null
      try {
        d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return
      }
      if (!d) return
      if (d.event === 'ready') {
        post({ method: 'addEventListener', value: 'play' })
        post({ method: 'addEventListener', value: 'timeupdate' })
      } else if (d.event === 'play') {
        setReady(true)
      } else if (d.event === 'timeupdate' && (d.data?.seconds ?? 0) > 0) {
        setReady(true) // respaldo por si no llega 'play'
      }
    }
    window.addEventListener('message', onMsg)

    // Pausa/reanuda según visibilidad (sin reiniciar), sin cortar el autoplay.
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting === playing.current) return
        playing.current = e.isIntersecting
        post({ method: e.isIntersecting ? 'play' : 'pause' })
      },
      { threshold: 0.35 }
    )
    io.observe(wrap)

    // Salvavidas: si no llegan eventos, destapar tras unos segundos.
    const fb = setTimeout(() => setReady(true), 2500)

    return () => {
      window.removeEventListener('message', onMsg)
      io.disconnect()
      clearTimeout(fb)
    }
  }, [])

  if (!id) return null
  const src = `https://player.vimeo.com/video/${id}?${hash ? `h=${hash}&` : ''}background=1&autoplay=1&muted=1&loop=1&dnt=1&api=1&player_id=${pid}`

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <iframe
        ref={iframeRef}
        src={src}
        title=""
        aria-hidden
        allow="autoplay; fullscreen"
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0 bg-black ${className}`}
        style={{ width: 'max(100cqw, 177.78cqh)', height: 'max(56.25cqw, 100cqh)' }}
      />
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            ready ? 'opacity-0' : 'opacity-100'
          } ${className}`}
        />
      )}
    </div>
  )
}
