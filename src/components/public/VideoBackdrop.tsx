'use client'

import { useEffect, useRef } from 'react'
import { parseVimeo } from '@/lib/utils'

// Máscaras SVG con formas de «agua»: manchas orgánicas (blobs + elipses)
// desenfocadas con feGaussianBlur, así los bordes se difuminan por completo y
// no hay aristas de rectángulo. Blanco = visible; el resto deja ver el fondo.
// Dos variantes para dar variedad entre franjas.
function waterMask(variant: 0 | 1): string {
  const shapes =
    variant === 0
      ? `<path d='M90,220 C170,120 360,110 470,175 C600,250 690,120 830,150 C980,182 1050,150 1130,235 C1185,295 1050,340 890,305 C740,272 610,345 460,318 C320,292 165,335 100,270 Z'/>
         <ellipse cx='300' cy='232' rx='190' ry='96'/>
         <ellipse cx='840' cy='198' rx='230' ry='104'/>`
      : `<path d='M110,180 C210,250 340,300 480,255 C620,210 700,300 840,268 C980,236 1070,300 1120,215 C1160,150 1030,120 880,150 C740,178 640,110 490,150 C350,188 200,110 110,180 Z'/>
         <ellipse cx='420' cy='210' rx='210' ry='100'/>
         <ellipse cx='900' cy='230' rx='170' ry='92'/>`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 400' preserveAspectRatio='none'><defs><filter id='b' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='34'/></filter></defs><g filter='url(#b)' fill='#fff'>${shapes}</g></svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}

// Capa de vídeo «agua» para usar como FONDO absoluto dentro de un contenedor
// `relative`. El vídeo se compone en modo `screen`: sobre un fondo casi negro
// (#0a0a0a) solo APORTA luz en sus zonas claras, nunca oscurece — así jamás
// queda más oscuro que el fondo. Máscara de «agua» (SVG desenfocado) + opacidad
// muy baja: un reflejo líquido casi imperceptible detrás del contenido.
export function WaterVideoLayer({
  mp4,
  vimeoId,
  darken = 0.35,
  variant = 0,
  fixed = false,
  heroBelow = false,
  headerBias = false,
  opacityScale = 1,
  className = '',
}: {
  mp4?: string | null
  vimeoId?: string | null
  darken?: number
  variant?: 0 | 1
  fixed?: boolean
  heroBelow?: boolean // hay un hero de vídeo debajo (home): esperar a pasarlo
  headerBias?: boolean // concentrar el vídeo en el header (páginas internas)
  opacityScale?: number // multiplicador de opacidad (p. ej. páginas internas)
  className?: string
}) {
  const { id, hash } = vimeoId ? parseVimeo(vimeoId) : { id: '', hash: undefined }
  const layerRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  // El fondo global (fixed) es muy tenue; las franjas por-sección (clientes,
  // etc.) tienen más presencia como acento. Más «oscurecido» en Ajustes → menos.
  const opacity = fixed
    ? Math.max(0.03, 0.2 - darken * 0.24) * opacityScale
    : Math.max(0.07, 0.2 - darken * 0.2)

  // Parallax vertical: al hacer scroll, el vídeo se desplaza más lento que la
  // página, simulando profundidad. En modo `fixed` (fondo global de toda la
  // web) además NO aparece pegado al hero: arranca invisible y se funde poco a
  // poco al pasar el primer viewport, para no chocar con el vídeo de portada.
  useEffect(() => {
    const layer = layerRef.current
    const media = mediaRef.current
    if (!layer || !media) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight || 1
      let shift: number
      if (fixed) {
        // Deriva lenta y acotada del fondo global.
        const cap = vh * 0.18
        shift = Math.max(-cap, Math.min(cap, -window.scrollY * 0.05))
        // Fade-in: solo si hay un hero de vídeo debajo (home), para no chocar
        // con él. En páginas internas se ve desde arriba (en el header).
        const fadeIn = heroBelow
          ? Math.max(0, Math.min(1, (window.scrollY - vh * 0.6) / (vh * 0.8)))
          : 1
        layer.style.opacity = String(opacity * fadeIn)
      } else {
        const rect = layer.getBoundingClientRect()
        const progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2)
        shift = progress * rect.height * 0.16
      }
      media.style.transform = `translateY(${shift.toFixed(1)}px)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [fixed, opacity, heroBelow])

  if (!mp4 && !id) return null
  const mask = waterMask(variant)

  // Posición: por defecto cubre todo; con `headerBias` se concentra en la
  // franja superior (header) de las páginas internas.
  const positionClass = !fixed
    ? 'absolute inset-0'
    : headerBias
      ? 'fixed inset-x-0 top-0 h-[78vh]'
      : 'fixed inset-0'

  return (
    <div
      ref={layerRef}
      className={`pointer-events-none ${positionClass} overflow-hidden mix-blend-screen ${className}`}
      style={{
        // En fixed con hero debajo arranca invisible (el scroll lo funde); si
        // no, usa la opacidad base directamente (visible desde arriba).
        opacity: fixed ? (heroBelow ? 0 : opacity) : opacity,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
      aria-hidden
    >
      {/* Wrapper sobredimensionado (margen arriba/abajo) que recibe el parallax */}
      <div
        ref={mediaRef}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: '-24%', height: '148%' }}
      >
        {mp4 ? (
          <video
            src={mp4}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        ) : (
          <iframe
            src={`https://player.vimeo.com/video/${id}?${hash ? `h=${hash}&` : ''}background=1&autoplay=1&loop=1&muted=1&dnt=1`}
            className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
            allow="autoplay; fullscreen"
            title=""
          />
        )}
      </div>
    </div>
  )
}

// Franja dedicada con el vídeo de «agua» de fondo y `children` centrado encima.
export function VideoBand({
  children,
  mp4,
  vimeoId,
  height = '46vh',
  darken = 0.35,
  variant = 0,
  className = '',
}: {
  children?: React.ReactNode
  mp4?: string | null
  vimeoId?: string | null
  height?: string
  darken?: number
  variant?: 0 | 1
  className?: string
}) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ minHeight: height }}>
      <WaterVideoLayer mp4={mp4} vimeoId={vimeoId} darken={darken} variant={variant} />
      {children && (
        <div className="relative flex h-full min-h-[inherit] items-center justify-center px-6 text-center">
          {children}
        </div>
      )}
    </div>
  )
}
