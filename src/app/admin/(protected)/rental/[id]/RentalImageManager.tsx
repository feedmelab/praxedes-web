'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import SubmitButton from '../../_components/SubmitButton'
import { Field, TextInput } from '../../_components/ui'
import { useSortableList, SortableArea, SortableItem, DragHandle } from '../../_components/sortable'
import { addRentalImage, deleteRentalImage, reorderRentalImages } from '../actions'

export type RentalImageVM = { fileId: string; thumb: string }

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
                        className="aspect-square w-full object-cover"
                      />
                      <div className="absolute left-2 top-2 rounded bg-bg/80 p-1">
                        <DragHandle handle={handle} />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex justify-end bg-bg/85 p-2 opacity-0 transition-opacity group-hover:opacity-100">
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
