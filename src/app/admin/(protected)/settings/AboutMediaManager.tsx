'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import BackgroundVideo from '@/components/public/BackgroundVideo'
import FileButton from '../_components/FileButton'
import { useSortableList, SortableArea, SortableItem, DragHandle } from '../_components/sortable'
import { addAboutMedia, deleteAboutMedia, reorderAboutMedia, type AboutMediaRow } from './actions'

const isVideoUrl = (src: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)

export default function AboutMediaManager({ items }: { items: AboutMediaRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const byId = new Map(items.map((m) => [m.id, m]))

  const { ids, sensors, handleDragEnd } = useSortableList(
    items.map((m) => m.id),
    (next) =>
      startTransition(() => {
        void reorderAboutMedia(next)
      })
  )

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isVid = file.type.startsWith('video/')
    const maxMb = isVid ? 100 : 15
    if (file.size > maxMb * 1024 * 1024) {
      setMsg(`Máx. ${maxMb} MB.`)
      e.target.value = ''
      return
    }
    if (isVid && !/(mp4|webm)$/i.test(file.type)) {
      setMsg(
        'Aviso: usa .mp4 (H.264) o .webm; otros formatos pueden no reproducirse en el navegador.'
      )
    }
    setBusy(true)
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
      const res = await addAboutMedia(j.url)
      if (res?.error) throw new Error(res.error)
      router.refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteAboutMedia(id)
      router.refresh()
    })
  }

  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft">
        Fotos y vídeos de «Sobre mí»
      </p>
      <p className="mb-4 text-[12px] text-muted">
        Se van pasando solos con un fundido suave, en este orden. Arrastra para reordenar; el
        primero es el principal. Vertical (retrato) queda mejor. Los vídeos, en .mp4 (H.264).
      </p>

      {ids.length > 0 && (
        <SortableArea ids={ids} sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {ids.map((id, i) => {
              const m = byId.get(id)
              if (!m) return null
              return (
                <SortableItem key={id} id={id}>
                  {(handle) => (
                    <div className="group relative aspect-[4/5] overflow-hidden rounded border border-border bg-surface">
                      {isVideoUrl(m.url) ? (
                        <BackgroundVideo src={m.url} className="h-full w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="h-full w-full object-cover" />
                      )}
                      {i === 0 && (
                        <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full border border-accent/60 bg-bg/80 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-accent">
                          Principal
                        </span>
                      )}
                      <div className="absolute right-1.5 top-1.5 rounded bg-bg/80 p-1">
                        <DragHandle handle={handle} />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => remove(m.id)}
                          className="rounded bg-white/15 px-2 py-1 text-[9px] uppercase tracking-wider text-red-300 hover:bg-white/25 disabled:opacity-40"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  )}
                </SortableItem>
              )
            })}
          </div>
        </SortableArea>
      )}

      <div className="mt-3 max-w-[220px]">
        <FileButton
          accept="image/*,video/*"
          caption={busy ? 'Subiendo…' : 'Añadir foto o vídeo'}
          onChange={onFile}
          busy={busy}
        />
      </div>
      {msg && <p className="mt-2 text-[11px] text-red-400">{msg}</p>}
    </div>
  )
}
