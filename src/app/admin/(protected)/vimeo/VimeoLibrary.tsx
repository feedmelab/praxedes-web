'use client'

import { useState } from 'react'
import type { VimeoListItem } from '@/lib/vimeo'

function fmtDur(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          /* noop */
        }
      }}
      className="shrink-0 rounded border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-accent transition-colors hover:border-accent/60"
    >
      {done ? 'Copiado' : 'Copiar'}
    </button>
  )
}

export default function VimeoLibrary({ items }: { items: VimeoListItem[] }) {
  const [q, setQ] = useState('')
  const filtered = q
    ? items.filter((v) => v.name.toLowerCase().includes(q.toLowerCase()) || v.id.includes(q))
    : items

  return (
    <div className="space-y-6">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre o ID…"
        className="w-full max-w-sm rounded border border-border bg-surface px-3 py-2 text-sm text-light outline-none focus:border-accent/60"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <div key={v.id} className="overflow-hidden rounded border border-border bg-surface">
            <div className="relative aspect-video bg-black">
              {v.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumb} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-muted">
                  sin miniatura
                </div>
              )}
              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] tabular-nums text-light">
                {fmtDur(v.duration)}
              </span>
              <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-soft">
                {v.privacy}
              </span>
            </div>

            <div className="space-y-2 p-3">
              <p className="truncate text-sm text-light" title={v.name}>
                {v.name}
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-bg px-2 py-1 font-mono text-[11px] text-accent">
                  {v.param}
                </code>
                <CopyButton value={v.param} />
              </div>
              <a
                href={v.link}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-[10px] uppercase tracking-wider text-muted transition-colors hover:text-accent"
              >
                Abrir en Vimeo ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-sm text-muted">Sin resultados.</p>}
    </div>
  )
}
