'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveAboutImage, type AboutSlot } from './actions'

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
      <div className="aspect-[4/5] w-full overflow-hidden rounded border border-border bg-surface">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted">
            vacío
          </div>
        )}
      </div>
      <label className="mt-2 block cursor-pointer text-[10px] uppercase tracking-wider text-accent hover:underline">
        {busy ? 'Subiendo…' : url ? 'Reemplazar' : 'Subir'}
        <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
      </label>
      {url && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="mt-1 text-[10px] uppercase tracking-wider text-red-400 hover:underline disabled:opacity-40"
        >
          Quitar
        </button>
      )}
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

// Cinco fotos de «Sobre mí» dispuestas en cruz: al acercar el cursor a un lado,
// esa imagen se arrastra y se centra en el marco. Sube el centro (obligatorio)
// y, opcionalmente, las 4 variantes de los lados.
export default function AboutImageUpload({ images }: { images: AboutImages }) {
  return (
    <div className="mt-6 border-t border-border pt-6">
      <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft">
        Fotos de «Sobre mí» (efecto cruz)
      </p>
      <p className="mb-4 text-[12px] text-muted">
        La del centro es la principal. Las de arriba/abajo/izquierda/derecha aparecen al mover el
        cursor hacia ese lado. Vertical (retrato) queda mejor. Si dejas un lado vacío, se usa la del
        centro.
      </p>

      <div className="grid max-w-[520px] grid-cols-3 gap-3">
        <div />
        <SlotUpload label="Arriba" slot="top" current={images.top} />
        <div />
        <SlotUpload label="Izquierda" slot="left" current={images.left} />
        <SlotUpload label="Centro" slot="center" current={images.center} />
        <SlotUpload label="Derecha" slot="right" current={images.right} />
        <div />
        <SlotUpload label="Abajo" slot="bottom" current={images.bottom} />
        <div />
      </div>
    </div>
  )
}
