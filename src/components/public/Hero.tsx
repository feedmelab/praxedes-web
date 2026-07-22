'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

// Hero de la home. Si hay reel de Vimeo lo embebe de fondo; si no, un
// degradado sobrio (placeholder). Parallax sutil al hacer scroll — moderado,
// como pide el brief.
export default function Hero({ reelVimeoId }: { reelVimeoId?: string | null }) {
  const t = useTranslations('home')
  const mediaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        if (y < window.innerHeight) el.style.transform = `translateY(${y * 0.18}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header className="relative flex h-screen min-h-[600px] flex-col items-center justify-center overflow-hidden text-center">
      <div ref={mediaRef} className="parallax-layer absolute inset-0 z-0">
        {reelVimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${reelVimeoId}?background=1&autoplay=1&loop=1&muted=1&dnt=1`}
            className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
            allow="autoplay; fullscreen"
            title="Reel"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, rgba(40,36,30,.5), transparent 70%), linear-gradient(180deg,#0d0c0b 0%,#131110 45%,#0a0a0a 100%)',
            }}
          />
        )}
      </div>

      {/* Viñeta para legibilidad */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(10,10,10,.75) 100%)',
        }}
      />

      <div className="relative z-[2] px-6">
        <p className="mb-6 animate-fade-up text-[0.7rem] uppercase tracking-[0.32em] text-accent">
          {t('eyebrow')}
        </p>
        <h1 className="animate-fade-up font-display text-[clamp(2.8rem,8vw,6.5rem)] font-normal leading-[0.98] tracking-[0.01em]">
          Práxedes
          <br />
          de Vilallonga
        </h1>
        <p className="mt-6 animate-fade-up text-[clamp(0.8rem,1.6vw,1rem)] uppercase tracking-[0.16em] text-soft">
          {t('claim')}
        </p>
      </div>

      <div className="absolute bottom-9 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-3 text-[0.62rem] uppercase tracking-[0.25em] text-muted">
        <span>{t('scroll')}</span>
        <span className="h-10 w-px bg-gradient-to-b from-muted to-transparent" />
      </div>
    </header>
  )
}
