'use client'

import { useEffect, useState } from 'react'

// Botón de texto (abajo a la derecha) para activar el micrófono si aún no lo
// está. Desaparece cuando el sonido se activa o si el efecto no está disponible.
export default function AudioToggle({ locale }: { locale: 'es' | 'en' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if ((window as Window & { __pxAudioOn?: boolean }).__pxAudioOn) return
    setVisible(true)
    const hide = () => setVisible(false)
    window.addEventListener('px-audio-on', hide)
    window.addEventListener('px-audio-unavailable', hide)
    return () => {
      window.removeEventListener('px-audio-on', hide)
      window.removeEventListener('px-audio-unavailable', hide)
    }
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('px-enable-audio'))}
      className="absolute bottom-6 right-5 z-[3] flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.22em] text-muted transition-colors hover:text-accent sm:bottom-8 sm:right-8"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
      {locale === 'en' ? 'Enable sound' : 'Activar sonido'}
    </button>
  )
}
