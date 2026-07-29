'use client'

import { useState } from 'react'
import { MIC_INFO_LABELS } from '@/lib/mic-info'

// Botón discreto en una esquina que explica el uso del micrófono. El texto es
// editable desde Ajustes (se pasa por prop, ya localizado).
export default function MicInfo({ text, locale }: { text: string; locale: 'es' | 'en' }) {
  const [open, setOpen] = useState(false)
  const labels = MIC_INFO_LABELS[locale]

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
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-[0.62rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
          >
            {labels.close}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
