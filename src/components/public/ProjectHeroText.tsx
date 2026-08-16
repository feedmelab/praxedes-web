'use client'

import { useState } from 'react'

// Anima EN SU SITIO el texto que ya tiene la portada del proyecto (cliente,
// título y categoría/año), al cargar la página, al estilo de una secuencia de
// créditos. Sin cortina ni overlay. Una variante al azar en cada visita; se
// desactiva con «reduce motion» (media query en el CSS).

const VARIANTS = 4

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
  const [v] = useState(() => Math.floor(Math.random() * VARIANTS))

  const clientEl = (
    <div
      className={`mb-4 text-[0.72rem] uppercase tracking-[0.28em] text-accent ${
        v === 3 ? 'v-track' : v === 2 ? 'v-slideL' : 'v-fadeup'
      }`}
      style={{ animationDelay: '0.15s' }}
    >
      {client}
    </div>
  )

  const titleEl =
    v === 0 ? (
      <h1 className="font-display text-[clamp(2.4rem,7vw,5rem)] font-normal leading-[1]">
        <Words text={title} base={0.35} step={0.07} />
      </h1>
    ) : (
      <div className="overflow-hidden">
        <h1
          className={`font-display text-[clamp(2.4rem,7vw,5rem)] font-normal leading-[1.02] ${
            v === 1 ? 'v-clip' : v === 2 ? 'v-slideup' : 'v-rise'
          }`}
        >
          {title}
        </h1>
      </div>
    )

  return (
    <>
      {clientEl}
      {titleEl}
      <div
        className="v-fadeup mt-5 flex flex-wrap gap-6 text-[0.72rem] uppercase tracking-[0.16em] text-soft"
        style={{ animationDelay: '1s' }}
      >
        {meta.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>

      <style>{`
        @keyframes vFadeUp { from { opacity:0; transform: translateY(1.1em); } to { opacity:1; transform: translateY(0); } }
        @keyframes vWord { from { opacity:0; transform: translateY(105%); } to { opacity:1; transform: translateY(0); } }
        @keyframes vRise { from { opacity:0; transform: translateY(115%); } to { opacity:1; transform: translateY(0); } }
        @keyframes vClip { from { opacity:.15; clip-path: inset(0 50% 0 50%); } to { opacity:1; clip-path: inset(0 0 0 0); } }
        @keyframes vSlideUp { from { opacity:0; transform: translateY(1em) skewY(3deg); } to { opacity:1; transform: translateY(0) skewY(0); } }
        @keyframes vSlideL { from { opacity:0; transform: translateX(-1.4em); } to { opacity:1; transform: translateX(0); } }
        @keyframes vTrack { from { opacity:0; letter-spacing:.7em; } to { opacity:1; letter-spacing:.28em; } }

        .v-fadeup { animation: vFadeUp .8s cubic-bezier(.16,1,.3,1) both; }
        .v-word   { animation: vWord .75s cubic-bezier(.16,1,.3,1) both; }
        .v-rise   { animation: vRise .85s cubic-bezier(.16,1,.3,1) .3s both; }
        .v-clip   { animation: vClip .95s cubic-bezier(.76,0,.24,1) .3s both; }
        .v-slideup{ animation: vSlideUp .85s cubic-bezier(.16,1,.3,1) .3s both; }
        .v-slideL { animation: vSlideL .8s cubic-bezier(.16,1,.3,1) both; }
        .v-track  { animation: vTrack .9s ease both; }

        @media (prefers-reduced-motion: reduce) {
          .v-fadeup, .v-word, .v-rise, .v-clip, .v-slideup, .v-slideL, .v-track {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}
