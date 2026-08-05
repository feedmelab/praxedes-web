'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Field, TextInput } from '../../_components/ui'
import FileButton from '../../_components/FileButton'
import { useSortableList, SortableArea, SortableItem, DragHandle } from '../../_components/sortable'
import {
  addProjectImage,
  addProjectVideo,
  deleteProjectImage,
  setCoverImage,
  setCoverFocal,
  setCoverLetterbox,
  setImageFocal,
  toggleImageWide,
  updateImageAlt,
  reorderProjectImages,
} from '../actions'
import { FOCALS, FOCAL_LABEL, type Focal } from '@/lib/focal'

export type ImageVM = {
  id: string
  kind: 'IMAGE' | 'VIDEO'
  url: string
  thumb: string
  vimeoId: string
  isCover: boolean
  wide: boolean
  focal: Focal
  altEs: string
  altEn: string
}

// Selector de encuadre (arriba / centro / abajo).
function FocalPicker({
  value,
  onChange,
  disabled,
}: {
  value: Focal
  onChange: (f: Focal) => void
  disabled?: boolean
}) {
  return (
    <div className="flex overflow-hidden rounded-sm border border-border">
      {FOCALS.map((f) => (
        <button
          key={f}
          type="button"
          disabled={disabled}
          onClick={() => onChange(f)}
          title={`Encuadre: ${FOCAL_LABEL[f]}`}
          className={`px-2 py-1 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40 ${
            value === f ? 'bg-accent text-bg' : 'text-muted hover:text-light'
          }`}
        >
          {FOCAL_LABEL[f]}
        </button>
      ))}
    </div>
  )
}

export default function ImageManager({
  projectId,
  images,
  coverFocal,
  coverLetterbox,
}: {
  projectId: string
  images: ImageVM[]
  coverFocal: Focal
  coverLetterbox: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [videoInput, setVideoInput] = useState('')
  const [videoErr, setVideoErr] = useState<string | null>(null)
  const upload = addProjectImage.bind(null, projectId)
  const byId = new Map(images.map((img) => [img.id, img]))

  const { ids, sensors, handleDragEnd } = useSortableList(
    images.map((i) => i.id),
    (next) => startTransition(() => reorderProjectImages(projectId, next))
  )

  function addVideo() {
    setVideoErr(null)
    startTransition(async () => {
      const r = await addProjectVideo(projectId, videoInput)
      if (r?.error) setVideoErr(r.error)
      else setVideoInput('')
    })
  }

  return (
    <div className="space-y-5">
      {/* Añadir foto o vídeo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <form
          action={async (fd) => {
            await upload(fd)
          }}
          className="flex items-end"
        >
          <div className="flex-1">
            <Field label="Añadir foto">
              <FileButton name="file" accept="image/*" caption="Añadir foto" autoSubmit required />
            </Field>
          </div>
        </form>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Field label="Añadir vídeo de Vimeo" hint="ID o URL (con hash si es privado/unlisted)">
              <TextInput
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="123456789?h=abc123"
              />
            </Field>
          </div>
          <button
            type="button"
            disabled={pending || !videoInput.trim()}
            onClick={addVideo}
            className="rounded-sm border border-accent/50 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-accent transition-all hover:bg-accent hover:text-bg disabled:opacity-40"
          >
            Añadir vídeo
          </button>
        </div>
      </div>
      {videoErr && <p className="text-xs text-red-400">{videoErr}</p>}

      {/* Encuadre de la portada (cómo se recorta en las tarjetas de la web) */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded border border-border bg-bg/40 px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Encuadre de la portada
          </span>
          <FocalPicker
            value={coverFocal}
            disabled={pending}
            onChange={(f) => startTransition(() => setCoverFocal(projectId, f))}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-soft">
          <input
            type="checkbox"
            defaultChecked={coverLetterbox}
            disabled={pending}
            onChange={(e) =>
              startTransition(() => setCoverLetterbox(projectId, e.currentTarget.checked))
            }
            className="h-3.5 w-3.5 accent-accent"
          />
          Mostrar portada completa (no recortar franjas)
        </label>
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted">Sin contenido. Sube una foto o añade un vídeo.</p>
      ) : (
        <SortableArea ids={ids} sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ids.map((id) => {
              const img = byId.get(id)
              if (!img) return null
              return (
                <SortableItem key={id} id={id}>
                  {(handle) => (
                    <div className="flex gap-3 rounded border border-border bg-bg/40 p-3">
                      <div className="flex flex-col items-center gap-2">
                        <DragHandle handle={handle} />
                      </div>
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-surface">
                        {img.kind === 'VIDEO' ? (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
                            <span className="text-lg text-accent">▶</span>
                            <span className="text-[8px] uppercase tracking-wider text-muted">
                              Vídeo
                            </span>
                          </div>
                        ) : (
                          <>
                            <Image
                              src={img.thumb}
                              alt=""
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                            {img.isCover && (
                              <span className="absolute left-1 top-1 rounded-full border border-accent/60 bg-bg/80 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-accent">
                                Portada
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        {img.kind === 'VIDEO' ? (
                          <p className="font-mono text-[11px] text-soft">Vimeo: {img.vimeoId}</p>
                        ) : (
                          <>
                            <TextInput
                              defaultValue={img.altEs}
                              placeholder="Texto alt (ES)"
                              className="py-1.5 text-xs"
                              onBlur={(e) => {
                                if (e.target.value !== img.altEs)
                                  startTransition(() =>
                                    updateImageAlt(img.id, e.target.value, img.altEn)
                                  )
                              }}
                            />
                            <TextInput
                              defaultValue={img.altEn}
                              placeholder="Alt text (EN)"
                              className="py-1.5 text-xs"
                              onBlur={(e) => {
                                if (e.target.value !== img.altEn)
                                  startTransition(() =>
                                    updateImageAlt(img.id, img.altEs, e.target.value)
                                  )
                              }}
                            />
                          </>
                        )}
                        {img.kind === 'IMAGE' && (
                          <FocalPicker
                            value={img.focal}
                            disabled={pending}
                            onChange={(f) => startTransition(() => setImageFocal(img.id, f))}
                          />
                        )}
                        <div className="mt-auto flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider">
                          {img.kind === 'IMAGE' && !img.isCover && (
                            <button
                              disabled={pending}
                              onClick={() =>
                                startTransition(() => setCoverImage(projectId, img.url))
                              }
                              className="text-accent hover:underline disabled:opacity-40"
                            >
                              Portada
                            </button>
                          )}
                          <button
                            disabled={pending}
                            onClick={() =>
                              startTransition(() => toggleImageWide(img.id, !img.wide))
                            }
                            className={`hover:underline disabled:opacity-40 ${
                              img.wide ? 'text-accent' : 'text-muted'
                            }`}
                            title="Ancho en la galería"
                          >
                            {img.wide ? '2 columnas' : '1 columna'}
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => startTransition(() => deleteProjectImage(img.id))}
                            className="ml-auto text-red-400 hover:underline disabled:opacity-40"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </SortableItem>
              )
            })}
          </div>
        </SortableArea>
      )}
    </div>
  )
}
