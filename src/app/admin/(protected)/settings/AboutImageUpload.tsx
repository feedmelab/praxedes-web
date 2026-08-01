'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Field, TextInput } from '../_components/ui'
import { saveAboutImage } from './actions'

// Sube la foto de «Sobre mí» DIRECTAMENTE a ImageKit desde el navegador y
// guarda su URL en los ajustes. Muestra la imagen actual con opción de quitarla.
export default function AboutImageUpload({ current }: { current?: string | null }) {
  const router = useRouter()
  const [url, setUrl] = useState(current ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      setMsg('La imagen supera 15 MB. Usa una versión más ligera.')
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

      const res = await saveAboutImage(j.url)
      if (res?.error) throw new Error(res.error)
      setUrl(j.url)
      router.refresh()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function remove() {
    if (!confirm('¿Quitar la foto de «Sobre mí»?')) return
    setBusy(true)
    await saveAboutImage('')
    setUrl('')
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-soft">Foto de «Sobre mí»</p>
      <p className="mb-4 text-[12px] text-muted">
        Aparece junto a este texto en la página «Sobre mí» y en la home. Vertical (retrato) queda
        mejor.
      </p>

      {url && (
        <div className="mb-4 flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Sobre mí"
            className="aspect-[4/5] w-32 rounded border border-border object-cover"
          />
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-[11px] uppercase tracking-wider text-red-400 hover:underline disabled:opacity-40"
          >
            Quitar
          </button>
        </div>
      )}

      <Field label={busy ? 'Subiendo…' : url ? 'Reemplazar foto' : 'Subir foto'}>
        <TextInput type="file" accept="image/*" onChange={onFile} disabled={busy} />
      </Field>

      {msg && <p className="mt-2 text-xs text-red-400">{msg}</p>}
    </div>
  )
}
