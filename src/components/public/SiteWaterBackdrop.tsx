'use client'

import { usePathname } from '@/i18n/navigation'
import { WaterVideoLayer } from './VideoBackdrop'

// Fondo de «agua» global. Se comporta distinto según la página:
// - Home: hay un hero de vídeo arriba → el fondo espera a pasarlo (fade-in) y
//   cubre todo el viewport.
// - Páginas internas (sobre mí, contacto, proyectos, alquiler…): no hay hero,
//   así que el vídeo se concentra en el HEADER (parte superior).
// La intensidad y un velo de oscuridad son editables en Ajustes.
export default function SiteWaterBackdrop({
  mp4,
  vimeoId,
  darken,
  waterOpacity = 100,
  waterDarken = 0,
}: {
  mp4?: string | null
  vimeoId?: string | null
  darken: number
  waterOpacity?: number // 0–250 (%)
  waterDarken?: number // 0–100
}) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  // Misma intensidad en home y en páginas internas: el slider reacciona igual
  // en todas. (La diferencia real entre ellas es solo la posición: home cubre
  // todo tras el hero; internas se concentran en el header.)
  const scale = waterOpacity / 100
  const veil = Math.min(1, Math.max(0, waterDarken / 100))

  return (
    <>
      <WaterVideoLayer
        fixed
        className="-z-10"
        variant={0}
        darken={darken}
        mp4={mp4}
        vimeoId={vimeoId}
        heroBelow={isHome}
        headerBias={!isHome}
        opacityScale={scale}
      />
      {/* Velo oscuro editable: se pinta por encima del vídeo de agua pero por
          debajo del contenido, para bajar el tono del fondo. */}
      {veil > 0 && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-black"
          style={{ opacity: veil }}
        />
      )}
    </>
  )
}
