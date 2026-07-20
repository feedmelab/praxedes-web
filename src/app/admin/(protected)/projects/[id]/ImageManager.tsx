'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import SubmitButton from '../../_components/SubmitButton'
import { Field, TextInput } from '../../_components/ui'
import { addProjectImage, deleteProjectImage, setCoverImage } from '../actions'

export type ImageVM = {
  id: string
  url: string
  thumb: string
  isCover: boolean
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
              key={img.id}
              className="group relative overflow-hidden rounded border border-border"
            >
              <Image
                src={img.thumb}
                alt=""
                width={300}
                height={300}
                className="aspect-square w-full object-cover"
              />
              {img.isCover && (
                <span className="absolute left-2 top-2 rounded-full border border-accent/60 bg-bg/80 px-2 py-0.5 text-[9px] uppercase tracking-wider text-accent">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-bg/85 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isCover && (
                  <button
                    disabled={pending}
                    onClick={() => startTransition(() => setCoverImage(projectId, img.url))}
                    className="text-[10px] uppercase tracking-wider text-accent hover:underline disabled:opacity-40"
                  >
                    Portada
                  </button>
                )}
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => deleteProjectImage(img.id))}
                  className="ml-auto text-[10px] uppercase tracking-wider text-red-400 hover:underline disabled:opacity-40"
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
