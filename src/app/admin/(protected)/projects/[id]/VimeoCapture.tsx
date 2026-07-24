'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Script from 'next/script'
import { formatTimecode, parseTimecode, parseVimeo } from '@/lib/utils'
import { addProjectImage, addProjectImageFromUrl } from '../actions'

const FPS = 25 // estimación para el salto por fotograma

type VimeoPlayer = {
  on: (ev: string, cb: (data?: { seconds: number }) => void) => void
  getDuration: () => Promise<number>
  getCurrentTime: () => Promise<number>
  setCurrentTime: (t: number) => Promise<number>
  play: () => Promise<void>
  pause: () => Promise<void>
  destroy: () => Promise<void>
}

declare global {
  interface Window {
    Vimeo?: {
      Player: new (el: HTMLElement, opts?: Record<string, unknown>) => VimeoPlayer
    }
  }
}

type CaptureMode = 'progressive' | 'thumbnail'
type Captured =
  | { kind: 'blob'; blob: Blob; t: number; w: number; h: number }
  | { kind: 'url'; url: string; t: number; w: number; h: number }
type Status = { msg: string; kind: 'idle' | 'loading' | 'ok' | 'error' }

export default function VimeoCapture({
  projectId,
  vimeoId,
}: {
  projectId: string
  vimeoId: string
}) {
  const { id: vId, hash } = useMemo(() => parseVimeo(vimeoId), [vimeoId])
  const qs = hash ? `?h=${hash}` : ''

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const scrubbingRef = useRef(false)

  const [sdkReady, setSdkReady] = useState(false)
  const [mode, setMode] = useState<CaptureMode | null>(null)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [captured, setCaptured] = useState<Captured | null>(null)
  const [status, setStatus] = useState<Status>({ msg: '', kind: 'idle' })
  const [saving, startSave] = useTransition()
  const [timecodeInput, setTimecodeInput] = useState('')
  const [access, setAccess] = useState<'public' | 'private' | 'unknown'>('unknown')
  const [blocked, setBlocked] = useState(false) // vídeo privado sin acceso

  // Detecta si el vídeo es público o privado, y el modo de captura.
  useEffect(() => {
    fetch(`/api/admin/vimeo/${vId}${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setMode(d.mode)
          setAccess(d.access ?? 'unknown')
          if (d.mode === 'thumbnail') {
            setStatus({
              msg: 'Sin MP4 progresivo: se usará la API de miniaturas (calidad algo menor).',
              kind: 'idle',
            })
          }
        } else if (d.code === 'PRIVATE' || d.code === 'NO_TOKEN') {
          setBlocked(true)
          setStatus({ msg: d.error, kind: 'error' })
        } else {
          setStatus({ msg: `Vimeo: ${d.error}`, kind: 'error' })
        }
      })
      .catch(() => {})
  }, [vId, qs])

  // URL de embed directa del player (incluye el hash). Al usar un <iframe> con
  // esta src y adjuntar el SDK a él, evitamos la búsqueda oEmbed del SDK (que
  // devolvía "not found") — el iframe carga el player directamente.
  const embedSrc = useMemo(() => {
    const p = new URLSearchParams({
      controls: '1',
      autopause: '0',
      muted: '1', // silencio: evita el bloqueo de autoplay al pulsar Play
      playsinline: '1',
      dnt: '1',
    })
    if (hash) p.set('h', hash)
    return `https://player.vimeo.com/video/${vId}?${p.toString()}`
  }, [vId, hash])

  useEffect(() => {
    if (!sdkReady || !window.Vimeo || !iframeRef.current) return
    const player = new window.Vimeo.Player(iframeRef.current)
    playerRef.current = player

    player.on('loaded', async () => setDuration(await player.getDuration()))
    player.on('timeupdate', (data) => {
      if (!scrubbingRef.current && data) setCurrent(data.seconds)
    })
    player.on('play', () => setPlaying(true))
    player.on('pause', () => setPlaying(false))
    player.on('error', () =>
      setStatus({
        msg: 'El reproductor no pudo cargar el vídeo (privacidad/domain-embed de Vimeo).',
        kind: 'error',
      })
    )

    return () => {
      player.destroy().catch(() => {})
      playerRef.current = null
    }
  }, [sdkReady, vId, hash])

  const seekTo = useCallback(async (t: number) => {
    const player = playerRef.current
    if (!player) return
    const clamped = Math.max(0, t)
    await player.setCurrentTime(clamped)
    await player.pause()
    setCurrent(clamped)
  }, [])

  async function step(delta: number) {
    const player = playerRef.current
    if (!player) return
    await seekTo((await player.getCurrentTime()) + delta)
  }

  async function togglePlay() {
    const player = playerRef.current
    if (!player) return
    if (playing) await player.pause()
    else await player.play()
  }

  function setPreview(url: string | null) {
    setPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return url
    })
  }

  // Captura nativa (canvas) desde el MP4 progresivo por el proxy same-origin.
  async function captureProgressive(t: number): Promise<Captured> {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'auto'
    video.src = `/api/admin/vimeo/${vId}/file${qs}`
    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject(new Error('No se pudo cargar el vídeo'))
      })
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve()
        video.onerror = () => reject(new Error('No se pudo posicionar en el timecode'))
        video.currentTime = t
      })
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas no disponible')
      ctx.drawImage(video, 0, 0)
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.92))
      if (!blob) throw new Error('canvas bloqueado por CORS')
      return { kind: 'blob', blob, t, w: canvas.width, h: canvas.height }
    } finally {
      video.removeAttribute('src')
      video.load()
    }
  }

  // Fallback: fotograma por timecode vía Pictures API (planes sin progresivo).
  async function captureThumbnail(t: number): Promise<Captured> {
    const r = await fetch(
      `/api/admin/vimeo/${vId}/thumb?t=${encodeURIComponent(t)}${hash ? `&h=${hash}` : ''}`
    )
    const d = await r.json()
    if (!d.ok) throw new Error(d.error || 'No se pudo generar la miniatura')
    return { kind: 'url', url: d.url, t, w: d.width, h: d.height }
  }

  async function capture() {
    setStatus({ msg: 'Capturando fotograma…', kind: 'loading' })
    const player = playerRef.current
    const t = player ? await player.getCurrentTime() : current

    try {
      let result: Captured
      if (mode === 'progressive') {
        try {
          result = await captureProgressive(t)
        } catch {
          // Fallback automático a miniatura si el progresivo falla.
          setStatus({ msg: 'Progresivo no disponible, usando miniatura…', kind: 'loading' })
          result = await captureThumbnail(t)
        }
      } else {
        result = await captureThumbnail(t)
      }

      setCaptured(result)
      setPreview(result.kind === 'blob' ? URL.createObjectURL(result.blob) : result.url)
      setStatus({
        msg: `Fotograma capturado (${result.w}×${result.h}) · ${formatTimecode(result.t)}`,
        kind: 'ok',
      })
    } catch (e) {
      setStatus({ msg: e instanceof Error ? e.message : 'Error al capturar', kind: 'error' })
    }
  }

  function jumpToTimecode() {
    const t = parseTimecode(timecodeInput)
    if (t === null) {
      setStatus({ msg: 'Timecode inválido. Usa ss, mm:ss o hh:mm:ss.', kind: 'error' })
      return
    }
    seekTo(duration ? Math.min(t, duration) : t)
  }

  // Atajos de teclado: ←/→ fotograma, espacio play/pausa, C capturar.
  // Se ignoran si el foco está en un campo de texto (p.ej. el timecode).
  const handlersRef = useRef({ step, togglePlay, capture })
  handlersRef.current = { step, togglePlay, capture }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlersRef.current.step(-1 / FPS)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handlersRef.current.step(1 / FPS)
      } else if (e.code === 'Space') {
        e.preventDefault()
        handlersRef.current.togglePlay()
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        handlersRef.current.capture()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function save() {
    if (!captured) return
    startSave(async () => {
      let r: { error?: string; ok?: boolean } | undefined
      if (captured.kind === 'blob') {
        const fd = new FormData()
        fd.set(
          'file',
          new File([captured.blob], `vimeo-${vId}-${captured.t.toFixed(2)}.jpg`, {
            type: 'image/jpeg',
          })
        )
        // El fotograma extraído se guarda como una imagen más de la galería.
        r = await addProjectImage(projectId, fd)
      } else {
        r = await addProjectImageFromUrl(projectId, captured.url)
      }

      if (r && 'error' in r && r.error) {
        setStatus({ msg: r.error, kind: 'error' })
      } else {
        setStatus({ msg: 'Fotograma añadido al proyecto.', kind: 'ok' })
        setPreview(null)
        setCaptured(null)
      }
    })
  }

  const btn =
    'rounded-sm border border-border px-3 py-1.5 text-xs text-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-40'

  return (
    <div className="space-y-4">
      <Script
        src="https://player.vimeo.com/api/player.js"
        onLoad={() => setSdkReady(true)}
        strategy="afterInteractive"
      />

      {/* Indicador de acceso del vídeo */}
      {access === 'public' && (
        <p className="inline-flex items-center gap-2 rounded-sm border border-green-500/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.15em] text-green-400">
          ● Vídeo público — sin token
        </p>
      )}
      {access === 'private' && (
        <p className="inline-flex items-center gap-2 rounded-sm border border-accent/50 px-2.5 py-1 text-[11px] uppercase tracking-[0.15em] text-accent">
          ● Vídeo privado — con token de la cuenta
        </p>
      )}

      {/* Vídeo privado sin acceso: aviso claro en vez de un player que no carga */}
      {blocked ? (
        <div className="rounded border border-red-500/40 bg-red-500/5 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-red-400">
            Vídeo privado — no accesible
          </p>
          <p className="text-[11px] leading-relaxed text-soft">
            {status.msg}
            <br />
            Para vídeos privados de la cuenta de Práxedes, configura{' '}
            <code className="text-light">VIMEO_ACCESS_TOKEN</code> en el entorno. Si el vídeo
            debería ser público, cambia su privacidad en Vimeo a “Cualquiera” o permite el embed.
          </p>
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded border border-border bg-black">
          <iframe
            ref={iframeRef}
            src={embedSrc}
            className="h-full w-full border-0"
            style={{ border: 0 }}
            allow="autoplay; fullscreen; picture-in-picture"
            title="Vimeo"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1 / FPS}
          value={current}
          onChange={(e) => {
            scrubbingRef.current = false
            seekTo(Number(e.target.value))
          }}
          onInput={(e) => {
            scrubbingRef.current = true
            setCurrent(Number((e.target as HTMLInputElement).value))
          }}
          className="h-1 flex-1 cursor-pointer accent-accent"
        />
        <span className="w-40 text-right font-mono text-[11px] text-muted">
          {formatTimecode(current)} / {formatTimecode(duration)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={timecodeInput}
          onChange={(e) => setTimecodeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              jumpToTimecode()
            }
          }}
          placeholder="mm:ss o hh:mm:ss"
          className="w-32 rounded-sm border border-border bg-bg/40 px-2 py-1 font-mono text-[11px] text-light placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button type="button" className={btn} onClick={jumpToTimecode}>
          Ir a timecode
        </button>
        <span className="text-[11px] text-muted">
          Atajos: ← → fotograma · espacio play/pausa · C capturar
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={() => step(-1 / FPS)}>
          ‹ 1f
        </button>
        <button type="button" className={btn} onClick={() => step(1 / FPS)}>
          1f ›
        </button>
        <button type="button" className={btn} onClick={() => step(-1)}>
          −1s
        </button>
        <button type="button" className={btn} onClick={() => step(1)}>
          +1s
        </button>
        <button type="button" className={btn} onClick={() => step(-5)}>
          −5s
        </button>
        <button type="button" className={btn} onClick={() => step(5)}>
          +5s
        </button>
        <button type="button" className={btn} onClick={togglePlay}>
          {playing ? '❚❚ Pausa' : '▶ Play'}
        </button>
        <button
          type="button"
          onClick={capture}
          className="ml-auto rounded-sm border border-accent/50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-accent transition-all hover:bg-accent hover:text-bg"
        >
          Capturar fotograma
        </button>
      </div>

      {status.msg && (
        <p
          className={`text-[11px] ${
            status.kind === 'error'
              ? 'text-red-400'
              : status.kind === 'ok'
                ? 'text-green-400'
                : 'text-muted'
          }`}
        >
          {status.msg}
        </p>
      )}

      {previewUrl && captured && (
        <div className="flex flex-wrap items-start gap-4 rounded border border-border bg-bg/40 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Fotograma capturado"
            className="h-28 w-auto rounded border border-border"
          />
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] text-muted">
              {captured.w}×{captured.h} · {formatTimecode(captured.t)}
              {captured.kind === 'url' && ' · miniatura'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded-sm bg-accent px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-bg transition-all hover:bg-accent/90 disabled:opacity-40"
              >
                {saving ? 'Guardando…' : 'Guardar en el proyecto'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setPreview(null)
                  setCaptured(null)
                }}
                className="rounded-sm border border-border px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-light disabled:opacity-40"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
