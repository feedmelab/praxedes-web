'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveAboutImage, type AboutSlot } from './actions'
import { KindIcon, type Kind } from '../_components/FileButton'

const NEXT_KIND: Record<Kind, Kind> = { all: 'image', image: 'video', video: 'all' }
const ACCEPT: Record<Kind, string> = {
  all: 'image/*,video/*',
  image: 'image/*',
  video: 'video/*',
}
const KIND_LABEL: Record<Kind, string> = {
  all: 'Imagen o vídeo',
  image: 'Solo imagen',
  video: 'Solo vídeo',
}
const isVideoUrl = (src: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)

function SlotUpload({
  label,
  slot,
  current,
}: {
  label: string
  slot: AboutSlot
  current?: string | null
}) {
  const router = useRouter()
  const [url, setUrl] = useState(current ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [kind, setKind] = useState<Kind>('all')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      setMsg('Máx. 15 MB.')
      e.target.value = ''
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const authRes = await fetch('/api/imagekit-auth')
      const a = await authRes.json()
      if (!authRes.ok) throw new Error(a?.error || 'Auth ImageKit')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('fileName', file.name)
      fd.append('publicKey', a.publicKey)
      fd.append('token', a.token)
      fd.append('expire', String(a.expire))
      fd.append('signature', a.signature)
      fd.append('folder', '/praxedes/about')
      fd.append('useUniqueFileName', 'true')
      const up = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: fd,
      })
      const j = await up.json()
      if (!up.ok) throw new Error(j?.message || 'Error al subir')
      const res = await saveAboutImage(j.url, slot)
      if (res?.error) throw new Error(res.error)
      setUrl(j.url)
      router.refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function remove() {
    setBusy(true)
    await saveAboutImage('', slot)
    setUrl('')
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="rounded border border-border bg-bg/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <div className="group relative aspect-[4/5] w-full overflow-hidden rounded border border-border bg-surface">
        {url ? (
          <>
            {isVideoUrl(url) ? (
              <video
                src={url}
                className="h-full w-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={label} className="h-full w-full object-cover" />
            )}
            {/* Badge del tipo real del archivo, en la esquina. */}
            <span className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-black/60 p-1 text-white backdrop-blur">
              <KindIcon kind={isVideoUrl(url) ? 'video' : 'image'} className="h-3.5 w-3.5" />
            </span>
            {/* Acciones sobre la miniatura al pasar el cursor. */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <label className="cursor-pointer rounded bg-white/15 px-2 py-1 text-[9px] uppercase tracking-wider text-white hover:bg-white/25">
                {busy ? '…' : 'Cambiar'}
                <input
                  type="file"
                  accept={ACCEPT[kind]}
                  onChange={onFile}
                  disabled={busy}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded bg-white/15 px-2 py-1 text-[9px] uppercase tracking-wider text-red-300 hover:bg-white/25 disabled:opacity-40"
              >
                Quitar
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Botón «+» para añadir. */}
            <label
              className="flex h-full w-full cursor-pointer items-center justify-center text-muted transition-colors hover:bg-white/5 hover:text-accent"
              aria-label={`Añadir ${label}`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden>
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="file"
                accept={ACCEPT[kind]}
                onChange={onFile}
                disabled={busy}
                className="hidden"
              />
            </label>
            {/* Icono de tipo aceptado (cicla: todos → imagen → vídeo). */}
            <button
              type="button"
              onClick={() => setKind((k) => NEXT_KIND[k])}
              title={KIND_LABEL[kind]}
              aria-label={`Tipo aceptado: ${KIND_LABEL[kind]}`}
              className="absolute right-1.5 top-1.5 rounded bg-black/50 p-1 text-white/80 backdrop-blur hover:text-white"
            >
              <KindIcon kind={kind} className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
      {msg && <p className="mt-1 text-[10px] text-red-400">{msg}</p>}
    </div>
  )
}

export type AboutImages = {
  center?: string | null
  top?: string | null
  bottom?: string | null
  left?: string | null
  right?: string | null
}

// Fotos de «Sobre mí»: se van pasando solas con un fundido suave. La primera es
// la principal (obligatoria); las demás son opcionales y entran en el pase.
export default function AboutImageUpload({ images }: { images: AboutImages }) {
  return (
    <div className="mt-6 border-t border-border pt-6">
      <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft">Fotos de «Sobre mí»</p>
      <p className="mb-4 text-[12px] text-muted">
        Imágenes o vídeos que se van pasando solos con un fundido suave. La primera es la principal
        (obligatoria); las demás son opcionales y se añaden al pase. El icono de la esquina elige
        qué aceptar (todos / imagen / vídeo). Vertical (retrato) queda mejor.
      </p>

      <div className="grid max-w-[560px] grid-cols-2 gap-3 sm:grid-cols-3">
        <SlotUpload label="Principal" slot="center" current={images.center} />
        <SlotUpload label="Foto 2" slot="top" current={images.top} />
        <SlotUpload label="Foto 3" slot="right" current={images.right} />
        <SlotUpload label="Foto 4" slot="bottom" current={images.bottom} />
        <SlotUpload label="Foto 5" slot="left" current={images.left} />
      </div>
    </div>
  )
}
