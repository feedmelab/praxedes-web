'use client'

import { useEffect, useState } from 'react'

// Splash de entrada: nombre (pequeño) + lista de recursos que se están cargando,
// cada uno con su barra de progreso. Se mantiene hasta que todo está cargado
// (página + descarga real de los vídeos), con un mínimo en pantalla y un tope de
// seguridad. Una vez por sesión; se salta con «reduce motion».

type Item = { key: string; label: string; progress: number }

export default function Intro() {
  const [phase, setPhase] = useState<'in' | 'lift' | 'done'>('in')
  const [items, setItems] = useState<Item[]>([
    { key: 'page', label: 'Página', progress: 0 },
    { key: 'video', label: 'Vídeo', progress: 0 },
  ])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let seen = false
    try {
      seen = sessionStorage.getItem('intro-seen') === '1'
    } catch {
      /* noop */
    }
    if (reduce || seen) {
      setPhase('done')
      return
    }
    try {
      sessionStorage.setItem('intro-seen', '1')
    } catch {
      /* noop */
    }

    document.body.style.overflow = 'hidden'

    const MIN = 1200
    const MAX = 12000
    const start = Date.now()
    let lifted = false
    const timers: ReturnType<typeof setTimeout>[] = []
    let raf = 0

    const finish = () => {
      timers.push(
        setTimeout(() => {
          setPhase('done')
          document.body.style.overflow = ''
        }, 1000)
      )
    }
    const lift = () => {
      if (lifted) return
      lifted = true
      setItems((prev) => prev.map((it) => ({ ...it, progress: 1 })))
      setPhase('lift')
      finish()
    }

    // Progreso por recurso, calculado cada frame.
    const tick = () => {
      const elapsed = Date.now() - start

      // Página: readyState + rampa suave para que siempre avance.
      const pageReal =
        document.readyState === 'complete' ? 1 : document.readyState === 'interactive' ? 0.6 : 0.2
      const page = Math.max(pageReal, Math.min(0.9, elapsed / 1400))

      // Vídeo(s): descarga real (buffered/duration). Si no hay <video>, n/d.
      const vids = Array.from(document.querySelectorAll('video'))
      let video = 1
      const hasVideo = vids.length > 0
      if (hasVideo) {
        let sum = 0
        for (const v of vids) {
          if (v.readyState >= 4) sum += 1
          else if (isFinite(v.duration) && v.duration > 0 && v.buffered.length)
            sum += Math.min(1, v.buffered.end(v.buffered.length - 1) / v.duration)
          else sum += Math.min(0.5, v.readyState / 4)
        }
        video = sum / vids.length
      }

      setItems((prev) =>
        prev.map((it) => {
          if (it.key === 'page') return { ...it, progress: Math.max(it.progress, page) }
          if (it.key === 'video') return { ...it, progress: Math.max(it.progress, video) }
          return it
        })
      )

      // Levanta cuando todo esté completo, respetando el mínimo en pantalla.
      // En iOS el vídeo puede no bufferar al 100 % aunque ya se reproduzca;
      // con que esté listo para reproducir (readyState alto) basta para abrir.
      const anyPlayable = vids.some((v) => v.readyState >= 3)
      const ready = page >= 1 && (!hasVideo || video >= 0.9 || anyPlayable)
      if (ready && elapsed >= MIN) lift()
      if (!lifted) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    timers.push(setTimeout(lift, MAX)) // failsafe

    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      document.body.style.overflow = ''
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200] flex items-center justify-center bg-bg"
      style={{
        opacity: phase === 'lift' ? 0 : 1,
        transition: 'opacity 0.8s ease',
        willChange: 'opacity',
      }}
    >
      {/* Resplandor sutil */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 45%, rgba(200,169,110,0.10), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-[320px] px-6 text-center">
        <div className="intro-kicker mb-3 text-[0.55rem] uppercase tracking-[0.4em] text-accent">
          Estilista · Costume Designer
        </div>

        <h1 className="intro-rise mb-8 font-display text-[clamp(1.1rem,4vw,1.7rem)] font-normal leading-tight text-light">
          Práxedes de Vilallonga
        </h1>

        <div className="space-y-3">
          {items.map((it) => {
            const pct = Math.round(Math.min(1, it.progress) * 100)
            return (
              <div key={it.key} className="text-left">
                <div className="mb-1 flex items-center justify-between text-[0.56rem] uppercase tracking-[0.2em] text-muted">
                  <span>{it.label}</span>
                  <span className="tabular-nums text-soft">{pct}%</span>
                </div>
                <div className="h-px w-full overflow-hidden bg-border">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${pct}%`, transition: 'width 0.25s ease-out' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes introRise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes introFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .intro-rise { animation: introRise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .intro-kicker { animation: introFadeUp 0.8s ease 0.4s both; }
      `}</style>
    </div>
  )
}
