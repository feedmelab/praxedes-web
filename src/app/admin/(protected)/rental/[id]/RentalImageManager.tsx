'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import SubmitButton from '../../_components/SubmitButton'
import { Field, TextInput } from '../../_components/ui'
import { addRentalImage, deleteRentalImage } from '../actions'

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.fileId}
              className="group relative overflow-hidden rounded border border-border"
            >
              <Image
                src={img.thumb}
                alt=""
                width={300}
                height={300}
                className="aspect-square w-full object-cover"
              />
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
          ))}
        </div>
      )}
    </div>
  )
}
