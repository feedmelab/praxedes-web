'use client'

import ProjectHeroText from './ProjectHeroText'
import VimeoCover from './VimeoCover'

// Cabecera del proyecto. Si hay vídeo de portada (Vimeo), se reproduce en bucle
// (modo background, sin controles ni vídeos sugeridos) y se pausa/reanuda —sin
// reiniciar— según la cabecera esté en pantalla (lo gestiona VimeoCover). El
// resto del tiempo se ve la imagen de portada.
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
  return (
    <header className="relative flex h-[82vh] min-h-[520px] items-end overflow-hidden px-6 pb-10 pt-32 sm:px-10 lg:px-16 lg:pb-20">
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

      {/* Velo suave para legibilidad del texto (no solidifica el fondo). */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-bg/45 via-transparent to-transparent" />

      <div className="relative z-[2] w-full max-w-[1100px]">
        <ProjectHeroText client={client} title={title} meta={meta} />
      </div>
    </header>
  )
}
