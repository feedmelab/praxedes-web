'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import { Field } from '../../_components/ui'
import FileButton from '../../_components/FileButton'
import { useSortableList, SortableArea, SortableItem, DragHandle } from '../../_components/sortable'
import {
  addRentalImage,
  deleteRentalImage,
  reorderRentalImages,
  setRentalImageFocal,
} from '../actions'
import { FOCALS, FOCAL_LABEL, type Focal } from '@/lib/focal'

export type RentalImageVM = { fileId: string; thumb: string; focal: Focal }

export default function RentalImageManager({
  id,
  images,
}: {
  id: string
  images: RentalImageVM[]
}) {
  const [pending, startTransition] = useTransition()
  const upload = addRentalImage.bind(null, id)
  const byId = new Map(images.map((img) => [img.fileId, img]))

  const { ids, sensors, handleDragEnd } = useSortableList(
    images.map((i) => i.fileId),
    (next) => startTransition(() => reorderRentalImages(id, next))
  )

  return (
    <div className="space-y-5">
      <form
        action={async (fd) => {
          await upload(fd)
        }}
        className="flex items-end"
      >
        <div className="flex-1">
          <Field label="Añadir imagen">
            <FileButton name="file" accept="image/*" caption="Añadir imagen" autoSubmit required />
          </Field>
        </div>
      </form>

      {images.length === 0 ? (
        <p className="text-sm text-muted">Sin imágenes.</p>
      ) : (
        <SortableArea ids={ids} sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ids.map((fileId) => {
              const img = byId.get(fileId)
              if (!img) return null
              return (
                <SortableItem key={fileId} id={fileId}>
                  {(handle) => (
                    <div className="group relative overflow-hidden rounded border border-border">
                      <Image
                        src={img.thumb}
                        alt=""
                        width={300}
                        height={300}
                        className={`aspect-square w-full object-cover ${
                          img.focal === 'CENTER'
                            ? 'object-center'
                            : img.focal === 'BOTTOM'
                              ? 'object-bottom'
                              : 'object-top'
                        }`}
                      />
                      <div className="absolute left-2 top-2 rounded bg-bg/80 p-1">
                        <DragHandle handle={handle} />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-bg/85 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex overflow-hidden rounded-sm border border-border">
                          {FOCALS.map((f) => (
                            <button
                              key={f}
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                startTransition(() => setRentalImageFocal(id, img.fileId, f))
                              }
                              title={`Encuadre: ${FOCAL_LABEL[f]}`}
                              className={`flex-1 px-1 py-1 text-[9px] uppercase tracking-wider transition-colors disabled:opacity-40 ${
                                img.focal === f
                                  ? 'bg-accent text-bg'
                                  : 'text-muted hover:text-light'
                              }`}
                            >
                              {FOCAL_LABEL[f]}
                            </button>
                          ))}
                        </div>
                        <button
                          disabled={pending}
                          onClick={() => startTransition(() => deleteRentalImage(id, img.fileId))}
                          className="text-[10px] uppercase tracking-wider text-red-400 hover:underline disabled:opacity-40"
                        >
                          Borrar
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
    </div>
  )
}
