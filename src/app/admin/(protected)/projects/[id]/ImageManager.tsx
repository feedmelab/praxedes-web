'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import SubmitButton from '../../_components/SubmitButton'
import { Field, TextInput } from '../../_components/ui'
import { useSortableList, SortableArea, SortableItem, DragHandle } from '../../_components/sortable'
import {
  addProjectImage,
  deleteProjectImage,
  setCoverImage,
  updateImageAlt,
  reorderProjectImages,
} from '../actions'

export type ImageVM = {
  id: string
  url: string
  thumb: string
  isCover: boolean
  altEs: string
  altEn: string
}

export default function ImageManager({
  projectId,
  images,
}: {
  projectId: string
  images: ImageVM[]
}) {
  const [pending, startTransition] = useTransition()
  const upload = addProjectImage.bind(null, projectId)
  const byId = new Map(images.map((img) => [img.id, img]))

  const { ids, sensors, handleDragEnd } = useSortableList(
    images.map((i) => i.id),
    (next) => startTransition(() => reorderProjectImages(projectId, next))
  )

  return (
    <div className="space-y-5">
      <form
        action={async (fd) => {
          await upload(fd)
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1">
          <Field label="Añadir imagen">
            <TextInput type="file" name="file" accept="image/*" required />
          </Field>
        </div>
        <SubmitButton pendingText="Subiendo…" variant="outline">
          Subir
        </SubmitButton>
      </form>

      {images.length === 0 ? (
        <p className="text-sm text-muted">Sin imágenes.</p>
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
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded">
                        <Image src={img.thumb} alt="" fill sizes="96px" className="object-cover" />
                        {img.isCover && (
                          <span className="absolute left-1 top-1 rounded-full border border-accent/60 bg-bg/80 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-accent">
                            Portada
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                        <div className="mt-auto flex items-center gap-3 text-[10px] uppercase tracking-wider">
                          {!img.isCover && (
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
