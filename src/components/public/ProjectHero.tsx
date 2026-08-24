'use client'

import { useEffect, useRef, useState } from 'react'
import ProjectHeroText from './ProjectHeroText'
import VimeoCover from './VimeoCover'

// Cabecera del proyecto. Si hay vídeo de portada (Vimeo), se reproduce en bucle
// (modo background) y se pausa/reanuda según el viewport (lo gestiona
// VimeoCover). Con vídeo, el texto superpuesto se desvanece elegantemente tras
// la entrada y reaparece al pasar el cursor por la cabecera.
export default function ProjectHero({
  coverImage,
  coverLetterbox,
  vimeoId,
  client,
  title,
  meta,
}: {
  coverImage?: string | null
  coverLetterbox: boolean
  vimeoId?: string | null
  client: string
  title: string
  meta: string[]
}) {
  const ref = useRef<HTMLElement>(null)
  const [hover, setHover] = useState(false)
  const [settled, setSettled] = useState(false)
  const [scrolling, setScrolling] = useState(false)

  // Con vídeo: al entrar la portada en el viewport, el texto (con su animación)
  // se muestra un momento y luego se desvanece.
  useEffect(() => {
    if (!vimeoId) return
    const el = ref.current
    if (!el) return
    let t: ReturnType<typeof setTimeout>
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setSettled(false)
        clearTimeout(t)
        t = setTimeout(() => setSettled(true), 3200)
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimeout(t)
    }
  }, [vimeoId])

  // Al mover el scroll también reaparece el texto; se vuelve a ocultar poco
  // después de parar (si no hay hover ni animación de entrada en curso).
  useEffect(() => {
    if (!vimeoId) return
    let t: ReturnType<typeof setTimeout>
    const onScroll = () => {
      setScrolling(true)
      clearTimeout(t)
      t = setTimeout(() => setScrolling(false), 1200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(t)
    }
  }, [vimeoId])

  const textVisible = !vimeoId || hover || scrolling || !settled

  return (
    <header
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative flex h-[82vh] min-h-[520px] items-end overflow-hidden px-6 pb-10 pt-32 sm:px-10 lg:px-16 lg:pb-20"
    >
      <div
        className="absolute inset-0 z-0 [container-type:size]"
        style={{
          // La imagen del fondo se FUNDE A TRANSPARENTE en la parte inferior.
          maskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent 100%)',
        }}
      >
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt=""
            className={`h-full w-full object-cover brightness-[0.55] ${
              coverLetterbox ? '' : 'scale-[1.12]'
            }`}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: 'linear-gradient(135deg,#1a1714,#2a2118 55%,#0e0d0c)' }}
          />
        )}
        {/* Vídeo de portada: en bucle; se pausa/reanuda según el viewport. */}
        {vimeoId && (
          <VimeoCover vimeoId={vimeoId} poster={coverImage} className="brightness-[0.55]" />
        )}
      </div>

      {/* Velo suave para legibilidad del texto; se atenúa cuando el texto se oculta. */}
      <div
        className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-bg/45 via-transparent to-transparent transition-opacity duration-700 ${
          textVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`relative z-[2] w-full max-w-[1100px] transition-opacity duration-700 ease-out ${
          textVisible ? 'opacity-100' : 'opacity-[0.18]'
        }`}
      >
        <ProjectHeroText client={client} title={title} meta={meta} />
      </div>
    </header>
  )
}
