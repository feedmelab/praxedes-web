'use client'

import { useEffect, useState } from 'react'

// Anima EN SU SITIO el texto que ya tiene la portada del proyecto (cliente,
// título y categoría/año), al cargar. Sin cortina. Una variante al azar en cada
// visita. La variante se elige TRAS montar (no en SSR) para evitar mismatch de
// hidratación; hasta entonces el texto se muestra plano.

const VARIANTS = 3
// Tamaño del título según su longitud: los títulos largos se reducen para que
// no queden desproporcionados.
function titleClass(title: string): string {
  const n = title.length
  const size =
    n > 28
      ? 'text-[clamp(1.7rem,4.4vw,3rem)]'
      : n > 16
        ? 'text-[clamp(2rem,5.5vw,3.9rem)]'
        : 'text-[clamp(2.4rem,7vw,5rem)]'
  return `font-display ${size} font-normal leading-[1.03]`
}
const CLIENT_CLS = 'mb-4 text-[0.72rem] uppercase tracking-[0.28em] text-accent'
const META_CLS = 'mt-5 flex flex-wrap gap-6 text-[0.72rem] uppercase tracking-[0.16em] text-soft'

function Words({ text, base, step }: { text: string; base: number; step: number }) {
  const words = text.split(/\s+/)
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-baseline">
          <span
            className="v-word inline-block"
            style={{ animationDelay: `${base + Math.min(i, 9) * step}s` }}
          >
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

export default function ProjectHeroText({
  client,
  title,
  meta,
}: {
  client: string
  title: string
  meta: string[]
}) {
  const [v, setV] = useState<number | null>(null)
  const titleCls = titleClass(title)

  useEffect(() => {
    setV(Math.floor(Math.random() * VARIANTS))
  }, [])

  const metaEl = (animate: boolean) => (
    <div className={`${META_CLS} ${animate ? 'v-fadeup' : ''}`} style={{ animationDelay: '1s' }}>
      {meta.map((m, i) => (
        <span key={i}>{m}</span>
      ))}
    </div>
  )

  // SSR y primer render: texto plano (sin animación) → hidratación estable.
  if (v === null) {
    return (
      <>
        <div className={CLIENT_CLS}>{client}</div>
        <h1 className={titleCls}>{title}</h1>
        {metaEl(false)}
      </>
    )
  }

  const clientEl = (
    <div
      className={`${CLIENT_CLS} ${v === 2 ? 'v-track' : v === 1 ? 'v-slideL' : 'v-fadeup'}`}
      style={{ animationDelay: '0.15s' }}
    >
      {client}
    </div>
  )

  const titleEl =
    v === 0 ? (
      <h1 className={titleCls}>
        <Words text={title} base={0.35} step={0.07} />
      </h1>
    ) : (
      <div className="overflow-hidden">
        <h1 className={`${titleCls} ${v === 1 ? 'v-slideup' : 'v-rise'}`}>{title}</h1>
      </div>
    )

  return (
    <>
      {clientEl}
      {titleEl}
      {metaEl(true)}

      <style>{`
        @keyframes vFadeUp { from { opacity:0; transform: translateY(1.1em); } to { opacity:1; transform: translateY(0); } }
        @keyframes vWord { from { opacity:0; transform: translateY(105%); } to { opacity:1; transform: translateY(0); } }
        @keyframes vRise { from { opacity:0; transform: translateY(115%); } to { opacity:1; transform: translateY(0); } }
        @keyframes vSlideUp { from { opacity:0; transform: translateY(1em) skewY(3deg); } to { opacity:1; transform: translateY(0) skewY(0); } }
        @keyframes vSlideL { from { opacity:0; transform: translateX(-1.4em); } to { opacity:1; transform: translateX(0); } }
        @keyframes vTrack { from { opacity:0; letter-spacing:.7em; } to { opacity:1; letter-spacing:.28em; } }

        .v-fadeup { animation: vFadeUp .8s cubic-bezier(.16,1,.3,1) both; }
        .v-word   { animation: vWord .75s cubic-bezier(.16,1,.3,1) both; }
        .v-rise   { animation: vRise .85s cubic-bezier(.16,1,.3,1) .3s both; }
        .v-slideup{ animation: vSlideUp .85s cubic-bezier(.16,1,.3,1) .3s both; }
        .v-slideL { animation: vSlideL .8s cubic-bezier(.16,1,.3,1) both; }
        .v-track  { animation: vTrack .9s ease both; }

        @media (prefers-reduced-motion: reduce) {
          .v-fadeup, .v-word, .v-rise, .v-slideup, .v-slideL, .v-track { animation: none !important; }
        }
      `}</style>
    </>
  )
}
