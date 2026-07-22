'use client'

import { useEffect } from 'react'

// Fricción anti-descarga sobre las imágenes de la web pública: bloquea el menú
// contextual (clic derecho → guardar imagen) y el arrastre. Combinado con el
// CSS de globals.css (touch-callout / user-drag) frena el guardado casual en
// escritorio y móvil. No es infalible (una captura de pantalla siempre es
// posible), pero cubre el 99% de los intentos.
export default function MediaProtection() {
  useEffect(() => {
    const isImg = (t: EventTarget | null) => t instanceof HTMLImageElement

    const onContext = (e: MouseEvent) => {
      if (isImg(e.target)) e.preventDefault()
    }
    const onDrag = (e: DragEvent) => {
      if (isImg(e.target)) e.preventDefault()
    }

    document.addEventListener('contextmenu', onContext)
    document.addEventListener('dragstart', onDrag)
    return () => {
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('dragstart', onDrag)
    }
  }, [])

  return null
}
