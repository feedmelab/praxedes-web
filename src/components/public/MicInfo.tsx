'use client'

import { useEffect, useRef, useState } from 'react'
import { MIC_INFO_LABELS } from '@/lib/mic-info'

// Botón discreto en una esquina que explica el uso del micrófono. El texto es
// editable desde Ajustes (se pasa por prop, ya localizado). Al cargar la página
// se abre solo una vez por sesión y se cierra a los 8 s.
export default function MicInfo({ text, locale }: { text: string; locale: 'es' | 'en' }) {
  const [open, setOpen] = useState(false)
  // Mostrar "Activar sonido" solo si el micro aún no está activo y el efecto está
  // disponible.
  const [canEnable, setCanEnable] = useState(false)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoOpened = useRef(false) // el popup se abrió solo (no por el usuario)
  const labels = MIC_INFO_LABELS[locale]

  useEffect(() => {
    if ((window as Window & { __pxAudioOn?: boolean }).__pxAudioOn) return
    setCanEnable(true)
    const disable = () => setCanEnable(false)
    const onAudioOn = () => {
      setCanEnable(false)
      // Si el popup se había abierto solo, ciérralo al activarse el micro.
      if (autoOpened.current) {
        if (autoTimer.current) {
          clearTimeout(autoTimer.current)
          autoTimer.current = null
        }
        setOpen(false)
      }
    }
    window.addEventListener('px-audio-on', onAudioOn)
    window.addEventListener('px-audio-unavailable', disable)
    return () => {
      window.removeEventListener('px-audio-on', onAudioOn)
      window.removeEventListener('px-audio-unavailable', disable)
    }
  }, [])

  useEffect(() => {
    // Se abre solo al cargar (y se cierra a los 8 s) SÓLO si el micro no está
    // ya activado. Un pequeño retardo para dar tiempo a la auto-activación.
    const openTimer = setTimeout(() => {
      if ((window as Window & { __pxAudioOn?: boolean }).__pxAudioOn) return
      autoOpened.current = true
      setOpen(true)
      autoTimer.current = setTimeout(() => setOpen(false), 8000)
    }, 1200)
    return () => {
      clearTimeout(openTimer)
      if (autoTimer.current) clearTimeout(autoTimer.current)
    }
  }, [])

  // Al desplazar hacia abajo, se cierra el popup.
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40) {
        if (autoTimer.current) {
          clearTimeout(autoTimer.current)
          autoTimer.current = null
        }
        setOpen(false)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cualquier interacción manual cancela el cierre automático.
  function toggle() {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
    }
    setOpen((v) => !v)
  }
  function close() {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
    }
    setOpen(false)
  }

  return (
    <div className="absolute bottom-6 left-5 z-[3] sm:bottom-8 sm:left-8">
      {open && (
        <div
          role="dialog"
          aria-label={labels.title}
          className="mb-3 w-[min(78vw,300px)] rounded border border-border bg-bg/95 p-4 text-left shadow-xl backdrop-blur"
        >
          <p className="mb-2 text-[0.62rem] uppercase tracking-[0.2em] text-accent">
            {labels.title}
          </p>
          <p className="whitespace-pre-line text-[0.78rem] leading-relaxed text-soft">{text}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={close}
              className="text-[0.62rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
            >
              {labels.close}
            </button>
            {canEnable && (
              <button
                type="button"
                onClick={() => {
                  if (autoTimer.current) {
                    clearTimeout(autoTimer.current)
                    autoTimer.current = null
                  }
                  const w = window as Window & { __pxEnableAudio?: () => void }
                  if (w.__pxEnableAudio) w.__pxEnableAudio()
                  else window.dispatchEvent(new Event('px-enable-audio'))
                }}
                className="inline-flex items-center gap-1.5 rounded-sm border border-accent/50 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent hover:text-bg"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {labels.enable}
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={labels.title}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg/60 text-muted backdrop-blur transition-colors hover:border-accent hover:text-accent"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </button>
    </div>
  )
}
