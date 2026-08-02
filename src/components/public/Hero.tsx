'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import LiquidName from './LiquidName'
import MicInfo from './MicInfo'
import BackgroundVideo from './BackgroundVideo'
import { parseVimeo } from '@/lib/utils'

// Hero de la home. Reel de Vimeo de fondo (si existe) con parallax sutil.
// El indicador de scroll parpadea finamente y se desvanece al bajar; al volver
// arriba reaparece y vuelve a parpadear.
export default function Hero({
  reelVimeoId,
  reelMp4Url,
  micInfo,
  locale,
  colorBase,
  colorAccent,
  darken,
  fadeBottom,
  scrollFade,
}: {
  reelVimeoId?: string | null
  reelMp4Url?: string | null
  micInfo: string
  locale: 'es' | 'en'
  colorBase?: string | null
  colorAccent?: string | null
  darken?: number | null
  fadeBottom?: number | null
  scrollFade?: number | null
}) {
  const darkenPct = (darken ?? 35) / 100
  const fadeBottomPct = (fadeBottom ?? 70) / 100
  const scrollFadePct = (scrollFade ?? 85) / 100
  const t = useTranslations('home')
  const mediaRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  // Acepta "76979871", "76979871?h=abc", o una URL completa de Vimeo.
  const { id: reelId, hash: reelHash } = reelVimeoId
    ? parseVimeo(reelVimeoId)
    : { id: '', hash: undefined }

  useEffect(() => {
    const el = mediaRef.current
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(y > 4)
        setProgress(Math.min(1, y / window.innerHeight))
        if (el && y < window.innerHeight) el.style.transform = `translateY(${y * 0.18}px)`
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
        {reelMp4Url ? (
          <BackgroundVideo
            src={reelMp4Url}
            className="absolute left-1/2 top-1/2 h-full min-h-full w-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
          />
        ) : reelId ? (
          <iframe
            src={`https://player.vimeo.com/video/${reelId}?${reelHash ? `h=${reelHash}&` : ''}background=1&autoplay=1&loop=1&muted=1&dnt=1`}
            className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
            allow="autoplay; fullscreen"
            title="Reel"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 42%, rgba(32,28,22,.28), transparent 62%), linear-gradient(180deg,#0c0b0a 0%,#0f0e0d 45%,#0a0a0a 100%)',
            }}
          />
        )}
      </div>

      {/* Oscurecido general del vídeo para dar profundidad y legibilidad */}
      <div className="absolute inset-0 z-[1] bg-black" style={{ opacity: darkenPct }} />

      {/* Viñeta para legibilidad */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(10,10,10,.75) 100%)',
        }}
      />

      {/* Fundido inferior al color de la página (#0a0a0a). Siempre presente para
          un empalme suave con la sección siguiente; se intensifica al bajar. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[55%]"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, #0a0a0a 92%)',
          opacity: fadeBottomPct + progress * (1 - fadeBottomPct),
        }}
      />

      {/* Velo global que funde todo el vídeo al color de la página al hacer
          scroll (el nombre, en z-2, permanece por encima). */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-bg"
        style={{ opacity: progress * scrollFadePct }}
      />

      <div className="relative z-[2] px-6">
        <p className="mb-6 animate-fade-up text-[0.7rem] uppercase tracking-[0.32em] text-accent">
          {t('eyebrow')}
        </p>
        <LiquidName colorBase={colorBase} colorAccent={colorAccent} />
        <p className="mt-6 animate-fade-up text-[clamp(0.8rem,1.6vw,1rem)] uppercase tracking-[0.16em] text-soft">
          {t('claim')}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          const el = document.getElementById('work')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
          else window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
        }}
        aria-label={t('scroll')}
        className={`absolute bottom-9 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-3 text-[0.62rem] uppercase tracking-[0.25em] text-muted transition-[opacity,color] duration-700 hover:text-accent ${
          scrolled ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <span className={scrolled ? '' : 'hero-blink'}>{t('scroll')}</span>
        <span className="h-10 w-px bg-gradient-to-b from-current to-transparent" />
      </button>

      <MicInfo text={micInfo} locale={locale} />

      <style>{`
        @keyframes heroBlink { 0%, 100% { opacity: .28; } 50% { opacity: .85; } }
        .hero-blink { animation: heroBlink 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .hero-blink { animation: none; } }
      `}</style>
    </header>
  )
}
