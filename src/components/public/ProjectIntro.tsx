'use client'

import { useEffect, useState } from 'react'

// Rótulo de entrada tipo secuencia de créditos clásica (Saul Bass). Al cargar la
// ficha de proyecto aparece el cliente (subtítulo) y el título con una de varias
// animaciones, elegida al azar en cada visita; luego la cortina sube y revela la
// página. Se omite con «reduce motion».

const VARIANTS = 4

function Words({
  text,
  cls,
  base,
  step,
}: {
  text: string
  cls: string
  base: number
  step: number
}) {
  return (
    <>
      {text.split(/\s+/).map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-baseline">
          <span
            className={`inline-block ${cls}`}
            style={{ animationDelay: `${base + Math.min(i, 9) * step}s` }}
          >
            {w}
          </span>
          {i < text.split(/\s+/).length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

export default function ProjectIntro({ client, title }: { client: string; title: string }) {
  const [show, setShow] = useState(true)
  const [reduce, setReduce] = useState(false)
  const [variant] = useState(() => Math.floor(Math.random() * VARIANTS))

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduce(true)
      setShow(false)
      return
    }
    document.body.style.overflow = 'hidden'
    const id = setTimeout(() => {
      setShow(false)
      document.body.style.overflow = ''
    }, 2800)
    return () => {
      clearTimeout(id)
      document.body.style.overflow = ''
    }
  }, [])

  if (reduce || !show) return null

  return (
    <div
      aria-hidden
      className="intro-root fixed inset-0 z-[190] flex flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 45%, rgba(200,169,110,0.10), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-[1000px]">
        {/* Variante 0 — Escalonado por palabras */}
        {variant === 0 && (
          <>
            <div className="overflow-hidden">
              <p className="v-sub text-[clamp(0.7rem,1.4vw,0.9rem)] uppercase tracking-[0.32em] text-accent">
                {client}
              </p>
            </div>
            <div className="v-line mx-auto my-5 h-px w-24 origin-center bg-accent" />
            <h2 className="font-display text-[clamp(2.2rem,7vw,5rem)] font-normal leading-[1.05]">
              <Words text={title} cls="v-word" base={0.5} step={0.07} />
            </h2>
          </>
        )}

        {/* Variante 1 — Barras que barren y revelan (Psycho) */}
        {variant === 1 && (
          <>
            <div className="overflow-hidden">
              <p className="v-sub2 text-[clamp(0.7rem,1.4vw,0.9rem)] uppercase tracking-[0.4em] text-accent">
                {client}
              </p>
            </div>
            <div className="relative mt-5 inline-block">
              <h2 className="v-hard font-display text-[clamp(2.2rem,7vw,5rem)] font-normal leading-[1.02]">
                {title}
              </h2>
              {/* Barras del color del fondo que se retiran revelando el título */}
              <div className="pointer-events-none absolute inset-0 flex flex-col">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="v-bar flex-1 bg-bg"
                    style={{
                      animationDelay: `${0.35 + i * 0.12}s`,
                      transformOrigin: i % 2 ? 'right' : 'left',
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Variante 2 — Apertura desde el centro (Vertigo) */}
        {variant === 2 && (
          <>
            <div className="v-vline mx-auto mb-6 h-16 w-px origin-center bg-accent" />
            <h2 className="v-clip font-display text-[clamp(2.2rem,7vw,5rem)] font-normal leading-[1.02]">
              {title}
            </h2>
            <div className="overflow-hidden">
              <p className="v-sub3 mt-5 text-[clamp(0.7rem,1.4vw,0.9rem)] uppercase tracking-[0.32em] text-accent">
                {client}
              </p>
            </div>
          </>
        )}

        {/* Variante 3 — Deslizamiento con guías (North by Northwest) */}
        {variant === 3 && (
          <>
            <div className="relative overflow-hidden py-2">
              <span className="v-guide absolute left-0 top-1/2 h-px w-full bg-accent/60" />
              <p className="v-slideL text-[clamp(0.7rem,1.4vw,0.9rem)] uppercase tracking-[0.3em] text-accent">
                {client}
              </p>
            </div>
            <div className="mt-4 overflow-hidden">
              <h2 className="v-slideUp font-display text-[clamp(2.2rem,7vw,5rem)] font-normal leading-[1.05]">
                {title}
              </h2>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes vFadeUp { from { opacity:0; transform: translateY(1.2em); } to { opacity:1; transform: translateY(0); } }
        @keyframes vWord { from { opacity:0; transform: translateY(105%); } to { opacity:1; transform: translateY(0); } }
        @keyframes vLine { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes vVLine { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes vBarOut { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @keyframes vClip {
          from { opacity:.2; clip-path: inset(0 50% 0 50%); }
          to   { opacity:1; clip-path: inset(0 0 0 0); }
        }
        @keyframes vTrack { from { opacity:0; letter-spacing: .8em; } to { opacity:1; letter-spacing: .4em; } }
        @keyframes vGuide { from { transform: translateX(-100%);} to { transform: translateX(0);} }
        @keyframes vSlideL { from { opacity:0; transform: translateX(-1.5em);} to { opacity:1; transform: translateX(0);} }
        @keyframes vSlideUp { from { opacity:0; transform: translateY(1.1em) skewY(3deg);} to { opacity:1; transform: translateY(0) skewY(0);} }
        @keyframes introOut { to { opacity: 0; transform: translateY(-6%); } }

        /* V0 */
        .v-sub { animation: vFadeUp .7s cubic-bezier(.16,1,.3,1) .2s both; }
        .v-line { animation: vLine .6s cubic-bezier(.7,0,.2,1) .45s both; }
        .v-word { animation: vWord .7s cubic-bezier(.16,1,.3,1) both; }
        /* V1 */
        .v-sub2 { animation: vTrack .9s ease .2s both; }
        .v-hard { opacity: 0; animation: vFadeUp .01s linear .3s forwards; }
        .v-bar { animation: vBarOut .55s cubic-bezier(.7,0,.2,1) both; }
        /* V2 */
        .v-vline { animation: vVLine .5s cubic-bezier(.7,0,.2,1) .2s both; }
        .v-clip { animation: vClip .9s cubic-bezier(.76,0,.24,1) .55s both; }
        .v-sub3 { animation: vFadeUp .7s ease 1.1s both; }
        /* V3 */
        .v-guide { animation: vGuide .7s cubic-bezier(.7,0,.2,1) .2s both; }
        .v-slideL { animation: vSlideL .7s cubic-bezier(.16,1,.3,1) .5s both; }
        .v-slideUp { animation: vSlideUp .8s cubic-bezier(.16,1,.3,1) .55s both; }
        /* Salida común (cortina sube) */
        .intro-root { animation: introOut .8s ease 2s forwards; will-change: transform, opacity; }
      `}</style>
    </div>
  )
}
