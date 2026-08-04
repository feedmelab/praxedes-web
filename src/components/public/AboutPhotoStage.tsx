'use client'

import { useEffect, useRef } from 'react'

type Imgs = {
  center: string
  top?: string | null
  bottom?: string | null
  left?: string | null
  right?: string | null
}

// Cinco fotos dispuestas en cruz dentro de un marco. Al acercar/mover el cursor
// hacia un lado, la escena se «arrastra» y la imagen de ese lado se centra en el
// marco visible. Al salir, vuelve a la del centro. Un solo eje a la vez (para no
// mostrar esquinas vacías). Se desactiva con «reduce motion».
export default function AboutPhotoStage({ images }: { images: Imgs }) {
  const frame = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)

  const top = images.top || images.center
  const bottom = images.bottom || images.center
  const left = images.left || images.center
  const right = images.right || images.center

  useEffect(() => {
    const fr = frame.current
    const st = stage.current
    if (!fr || !st) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let tx = 0
    let ty = 0 // objetivo (fracción -1..1)
    let cx = 0
    let cy = 0 // actual (suavizado)
    let raf = 0
    let running = false

    const loop = () => {
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      // Traslada la escena una celda como máximo (100% del marco por lado).
      st.style.transform = `translate(${(-cx * 100) / 3}%, ${(-cy * 100) / 3}%)`
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(loop)
      } else {
        running = false
      }
    }
    const kick = () => {
      if (!running) {
        running = true
        raf = requestAnimationFrame(loop)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (reduce) return
      const r = fr.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1
      // Eje dominante para arrastrar hacia uno de los 4 puntos.
      if (Math.abs(nx) >= Math.abs(ny)) {
        tx = Math.max(-1, Math.min(1, nx))
        ty = 0
      } else {
        ty = Math.max(-1, Math.min(1, ny))
        tx = 0
      }
      kick()
    }
    const onLeave = () => {
      tx = 0
      ty = 0
      kick()
    }

    fr.addEventListener('pointermove', onMove)
    fr.addEventListener('pointerleave', onLeave)
    return () => {
      fr.removeEventListener('pointermove', onMove)
      fr.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  const cell = 'absolute h-1/3 w-1/3 object-cover'

  return (
    <div ref={frame} className="relative h-full w-full overflow-hidden">
      {/* Escena 3×3 (celdas de 1/3); solo centro + 4 brazos tienen imagen. */}
      <div
        ref={stage}
        className="absolute left-[-100%] top-[-100%] h-[300%] w-[300%] will-change-transform"
      >
        {/* eslint-disable @next/next/no-img-element */}
        <img src={top} alt="" className={`${cell} left-1/3 top-0`} />
        <img src={left} alt="" className={`${cell} left-0 top-1/3`} />
        <img src={images.center} alt="Sobre mí" className={`${cell} left-1/3 top-1/3`} />
        <img src={right} alt="" className={`${cell} left-2/3 top-1/3`} />
        <img src={bottom} alt="" className={`${cell} left-1/3 top-2/3`} />
        {/* eslint-enable @next/next/no-img-element */}
      </div>
    </div>
  )
}
