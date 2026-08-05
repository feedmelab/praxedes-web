'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '../_components/ui'
import FileButton from '../_components/FileButton'
import { saveHeroVideoUrl, deleteHeroVideo, type HeroVideo } from './actions'

// Sube un vídeo de fondo (.mp4) DIRECTAMENTE a ImageKit desde el navegador (sin
// pasar por el server action → sin límite del server), lista los ya subidos y
// permite usarlos como fondo o borrarlos de ImageKit.
export default function HeroVideoUpload({
  current,
  videos,
}: {
  current?: string | null
  videos: HeroVideo[]
}) {
  const router = useRouter()
  const [url, setUrl] = useState(current ?? '')
  const [list, setList] = useState<HeroVideo[]>(videos)
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState<{ error?: string; ok?: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  // Sincroniza con el listado del servidor, pero SIN resucitar los que ya se
  // han borrado (ImageKit tarda un poco en reflejar el borrado en su listado).
  useEffect(() => {
    setList(videos.filter((v) => !removed.has(v.fileId)))
  }, [videos, removed])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) {
      setMsg({
        error: `El vídeo pesa ${(file.size / 1024 / 1024).toFixed(0)} MB y el máximo es 100 MB. Usa uno más corto o de menor resolución (720p/1080p).`,
      })
      e.target.value = ''
      return
    }
    setBusy(true)
    setProgress(0)
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

      // XHR para tener progreso real de subida.
      const j = await new Promise<{ url: string; message?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload')
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300) resolve(data)
            else reject(new Error(data?.message || 'Error al subir'))
          } catch {
            reject(new Error('Respuesta inválida al subir'))
          }
        }
        xhr.onerror = () => reject(new Error('Error de red al subir'))
        xhr.send(fd)
      })

      setProgress(100)
      const res = await saveHeroVideoUrl(j.url)
      if (res?.error) throw new Error(res.error)
      setUrl(j.url)
      setMsg({ ok: true })
      // Optimista: añade el vídeo al listado ya mismo…
      const jj = j as { url: string; fileId?: string; name?: string; size?: number }
      if (jj.fileId) {
        setList((prev) => [
          {
            fileId: jj.fileId!,
            name: jj.name ?? file.name,
            url: jj.url,
            size: jj.size ?? file.size,
          },
          ...prev.filter((x) => x.fileId !== jj.fileId),
        ])
      }
      router.refresh() // …y sincroniza con el servidor
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : 'Error al subir' })
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  function use(u: string) {
    startTransition(async () => {
      const res = await saveHeroVideoUrl(u)
      if (!res?.error) setUrl(u)
    })
  }
  function remove(v: HeroVideo) {
    if (!confirm(`¿Borrar "${v.name}" de ImageKit? No se puede deshacer.`)) return
    // Optimista: quítalo del listado ya mismo.
    setList((prev) => prev.filter((x) => x.fileId !== v.fileId))
    if (url === v.url) setUrl('')
    startTransition(async () => {
      const res = await deleteHeroVideo(v.fileId, v.url)
      if (res?.error) {
        // Falló: restáuralo y avisa.
        setList((prev) => [v, ...prev])
        setMsg({ error: res.error })
        return
      }
      // Recuérdalo como borrado para que el refresco no lo resucite.
      setRemoved((prev) => new Set(prev).add(v.fileId))
      router.refresh()
    })
  }

  return (
    <Card>
      <header className="mb-6 border-b border-border pb-4">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-accent">
          Vídeo de fondo (home)
        </h2>
        <p className="mt-1.5 text-[12px] text-muted">
          Sube un .mp4 (loop oscuro, máx. 100 MB); se aloja en ImageKit y tiene prioridad sobre el
          reel de Vimeo. Abajo puedes reutilizar o borrar los ya subidos.
        </p>
      </header>

      <FileButton
        accept="video/mp4,video/*"
        caption={busy ? `Subiendo… ${progress}%` : 'Añadir vídeo (.mp4)'}
        onChange={onFile}
        busy={busy}
      />

      {busy && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded bg-border">
            <div
              className="h-full bg-accent transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-muted">{progress}%</span>
        </div>
      )}

      {msg?.error && <p className="mt-2 text-xs text-red-400">{msg.error}</p>}
      {msg?.ok && !busy && <p className="mt-2 text-xs text-green-400">Vídeo subido y activado.</p>}

      {list.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Vídeos subidos ({list.length})
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((v) => {
              const active = v.url === url
              return (
                <div
                  key={v.fileId}
                  className={`rounded border bg-surface p-3 ${active ? 'border-accent' : 'border-border'}`}
                >
                  <video
                    src={v.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="aspect-video w-full rounded bg-black object-cover"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted">
                      {v.name} · {(v.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <div className="flex shrink-0 gap-2 text-[10px] uppercase tracking-wider">
                      {active ? (
                        <span className="text-accent">En uso</span>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => use(v.url)}
                          className="text-accent hover:underline disabled:opacity-40"
                        >
                          Usar
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => remove(v)}
                        className="text-red-400 hover:underline disabled:opacity-40"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
