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
    let cy = 0 // posición actual
    let vx = 0
    let vy = 0 // velocidad (para el muelle)
    let cs = 1
    let vsc = 0 // escala actual + su velocidad
    let raf = 0
    let running = false

    // Muelle: rigidez baja + amortiguación media → entra con un rebote elástico.
    const STIFF = 0.09
    const DAMP = 0.76

    const loop = () => {
      vx += (tx - cx) * STIFF
      vx *= DAMP
      cx += vx
      vy += (ty - cy) * STIFF
      vy *= DAMP
      cy += vy

      // Zoom sutil cuanto más arrastrado esté (da cuerpo al gesto).
      const pull = Math.min(1, Math.abs(cx) + Math.abs(cy))
      const targetScale = 1 + pull * 0.08
      vsc += (targetScale - cs) * 0.12
      vsc *= 0.8
      cs += vsc

      st.style.transform = `translate(${(-cx * 100) / 3}%, ${(-cy * 100) / 3}%) scale(${cs.toFixed(4)})`

      const settled =
        Math.abs(tx - cx) < 0.0004 &&
        Math.abs(ty - cy) < 0.0004 &&
        Math.abs(vx) < 0.0004 &&
        Math.abs(vy) < 0.0004 &&
        Math.abs(targetScale - cs) < 0.0004
      if (!settled) {
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
      {/* Viñeta interior para dar profundidad al arrastre */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,.5)' }}
      />
    </div>
  )
}
