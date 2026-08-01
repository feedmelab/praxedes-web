'use client'

import { usePathname } from '@/i18n/navigation'
import { WaterVideoLayer } from './VideoBackdrop'

// Fondo de «agua» global. Se comporta distinto según la página:
// - Home: hay un hero de vídeo arriba → el fondo espera a pasarlo (fade-in) y
//   cubre todo el viewport.
// - Páginas internas (sobre mí, contacto, proyectos, alquiler…): no hay hero,
//   así que el vídeo se concentra en el HEADER (parte superior) y con MENOS
//   opacidad, para que aparezca ahí arriba de forma sutil.
export default function SiteWaterBackdrop({
  mp4,
  vimeoId,
  darken,
}: {
  mp4?: string | null
  vimeoId?: string | null
  darken: number
}) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <WaterVideoLayer
      fixed
      className="-z-10"
      variant={0}
      darken={darken}
      mp4={mp4}
      vimeoId={vimeoId}
      heroBelow={isHome}
      headerBias={!isHome}
      opacityScale={isHome ? 1 : 2.6}
    />
  )
}
