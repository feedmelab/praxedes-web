'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@/i18n/navigation'

// «Volver» fijo (abajo a la izquierda). Aparece al bajar a la galería y
// acompaña el scroll; al llegar al footer NO desaparece, sino que se frena justo
// por encima de él (queda a la altura de la última imagen). Vuelve a la página
// anterior del historial (o a la home si no hay).
export default function ProjectBack({ label }: { label: string }) {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > window.innerHeight * 0.7)
      const el = ref.current
      if (!el) return
      // Aparca por encima del footer: si el footer entra en pantalla, sube el
      // botón lo justo para que su base quede sobre el borde del footer.
      const footer = document.querySelector('footer')
      let shift = 0
      if (footer) {
        const top = footer.getBoundingClientRect().top
        const baseFromTop = window.innerHeight - 28 // ~bottom-6/8
        const overlap = baseFromTop - (top - 16)
        shift = overlap > 0 ? overlap : 0
      }
      el.style.transform = `translateY(${-shift}px)`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  function goBack() {
    if (window.history.length > 1) window.history.back()
    else router.push('/')
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={goBack}
      style={{ textShadow: '0 1px 10px rgba(0,0,0,.55)' }}
      className={`fixed bottom-6 left-6 z-40 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-soft transition-[opacity,color] duration-500 hover:text-accent sm:bottom-8 sm:left-10 lg:left-16 ${
        show ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <span className="h-px w-6 bg-current" />
      {label}
    </button>
  )
}
