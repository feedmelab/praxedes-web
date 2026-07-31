'use client'

import { useState } from 'react'
import { Card, Field, TextInput } from '../_components/ui'
import { saveHeroVideoUrl } from './actions'

// Sube un vídeo de fondo (.mp4) DIRECTAMENTE a ImageKit desde el navegador (sin
// pasar por el server action → sin límite de tamaño) y guarda su URL.
export default function HeroVideoUpload({ current }: { current?: string | null }) {
  const [url, setUrl] = useState(current ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ error?: string; ok?: boolean } | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
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
      fd.append('folder', '/praxedes/hero')
      fd.append('useUniqueFileName', 'true')

      const up = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: fd,
      })
      const j = await up.json()
      if (!up.ok) throw new Error(j?.message || 'Error al subir')

      const res = await saveHeroVideoUrl(j.url)
      if (res?.error) throw new Error(res.error)
      setUrl(j.url)
      setMsg({ ok: true })
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al subir' })
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <Card>
      <header className="mb-6 border-b border-border pb-4">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-accent">
          Subir vídeo de fondo (home)
        </h2>
        <p className="mt-1.5 text-[12px] text-muted">
          Sube un .mp4 (loop oscuro); se aloja en ImageKit y tiene prioridad sobre el reel de Vimeo.
          La subida va directa desde tu navegador, sin límite de tamaño.
        </p>
      </header>

      <Field label={busy ? 'Subiendo…' : 'Archivo de vídeo (.mp4)'}>
        <TextInput type="file" accept="video/mp4,video/*" onChange={onFile} disabled={busy} />
      </Field>

      {url && (
        <div className="mt-4 space-y-2">
          <p className="break-all font-mono text-[11px] text-muted">{url}</p>
          <video
            src={url}
            muted
            loop
            autoPlay
            playsInline
            className="aspect-video w-full max-w-sm rounded border border-border object-cover"
          />
        </div>
      )}

      {msg?.error && <p className="mt-2 text-xs text-red-400">{msg.error}</p>}
      {msg?.ok && <p className="mt-2 text-xs text-green-400">Vídeo subido y guardado.</p>}
    </Card>
  )
}
