'use client'

import { useEffect, useState } from 'react'

// Preloader de entrada para la home: revela el nombre desde una máscara + una
// línea dorada, y luego eleva la cortina para descubrir la página. Se muestra
// una vez por sesión y se salta si el usuario prefiere menos movimiento.
export default function Intro() {
  const [phase, setPhase] = useState<'in' | 'lift' | 'done'>('in')

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('intro-seen')

    if (reduce || seen) {
      setPhase('done')
      return
    }

    try {
      sessionStorage.setItem('intro-seen', '1')
    } catch {
      // sessionStorage no disponible → no pasa nada, se muestra igual.
    }

    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => setPhase('lift'), 1850)
    const t2 = setTimeout(() => {
      setPhase('done')
      document.body.style.overflow = ''
    }, 2850)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      document.body.style.overflow = ''
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200] flex items-center justify-center bg-bg"
      style={{
        transform: phase === 'lift' ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 1s cubic-bezier(0.76, 0, 0.24, 1)',
        willChange: 'transform',
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

      <div
        className="relative px-6 text-center"
        style={{
          opacity: phase === 'lift' ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      >
        <div className="intro-kicker mb-5 text-[0.6rem] uppercase tracking-[0.4em] text-accent sm:text-[0.68rem]">
          Estilista · Costume Designer
        </div>

        <h1 className="overflow-hidden">
          <span className="intro-rise block font-display text-[clamp(2rem,7vw,5rem)] font-normal leading-[1.05] text-light">
            Práxedes de Vilallonga
          </span>
        </h1>

        <div className="mt-6 flex justify-center">
          <span className="intro-line h-px w-24 origin-center bg-accent sm:w-32" />
        </div>
      </div>

      <style>{`
        @keyframes introRise {
          from { transform: translateY(115%); }
          to   { transform: translateY(0); }
        }
        @keyframes introFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes introLine {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .intro-rise {
          animation: introRise 1.15s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
        }
        .intro-kicker {
          animation: introFadeUp 0.9s ease 0.55s both;
        }
        .intro-line {
          animation: introLine 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both;
        }
      `}</style>
    </div>
  )
}
