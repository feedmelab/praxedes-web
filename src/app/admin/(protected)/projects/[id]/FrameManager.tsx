'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import SubmitButton from '../../_components/SubmitButton'
import { Field, TextInput } from '../../_components/ui'
import { formatTimecode } from '@/lib/utils'
import { addFrame, deleteFrame, toggleFramePublished } from '../actions'

export type FrameVM = {
  id: string
  thumb: string
  timecode: number
  published: boolean
}

export default function FrameManager({
  projectId,
  frames,
}: {
  projectId: string
  frames: FrameVM[]
}) {
  const [pending, startTransition] = useTransition()
  const upload = addFrame.bind(null, projectId)

  return (
    <div className="space-y-5">
      <form
        action={async (fd) => {
          await upload(fd)
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1">
          <Field label="Añadir frame">
            <TextInput type="file" name="file" accept="image/*" required />
          </Field>
        </div>
        <div className="w-28">
          <Field label="Timecode (s)">
            <TextInput type="number" name="timecode" step="0.01" min="0" defaultValue="0" />
          </Field>
        </div>
        <SubmitButton pendingText="Subiendo…" variant="outline">
          Subir
        </SubmitButton>
      </form>

      {frames.length === 0 ? (
        <p className="text-sm text-muted">Sin frames documentados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {frames.map((f) => (
            <div key={f.id} className="group relative overflow-hidden rounded border border-border">
              <Image
                src={f.thumb}
                alt=""
                width={300}
                height={200}
                className="aspect-video w-full object-cover"
              />
              <span className="absolute left-2 top-2 rounded bg-bg/80 px-1.5 py-0.5 font-mono text-[9px] text-light">
                {formatTimecode(f.timecode)}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-bg/85 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => toggleFramePublished(f.id, !f.published))}
                  className={`text-[10px] uppercase tracking-wider hover:underline disabled:opacity-40 ${
                    f.published ? 'text-green-400' : 'text-muted'
                  }`}
                >
                  {f.published ? 'Público' : 'Interno'}
                </button>
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => deleteFrame(f.id))}
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
