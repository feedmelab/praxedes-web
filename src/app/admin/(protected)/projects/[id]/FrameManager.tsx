'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import SubmitButton from '../../_components/SubmitButton'
import { Field, TextInput } from '../../_components/ui'
import FileButton from '../../_components/FileButton'
import { useSortableList, SortableArea, SortableItem, DragHandle } from '../../_components/sortable'
import {
  addFrame,
  deleteFrame,
  toggleFramePublished,
  updateFrameMeta,
  reorderFrames,
} from '../actions'

export type FrameVM = {
  id: string
  thumb: string
  timecode: number
  published: boolean
  labelEs: string
  labelEn: string
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
  const byId = new Map(frames.map((f) => [f.id, f]))

  const { ids, sensors, handleDragEnd } = useSortableList(
    frames.map((f) => f.id),
    (next) => startTransition(() => reorderFrames(projectId, next))
  )

  function saveMeta(f: FrameVM, patch: Partial<Pick<FrameVM, 'timecode' | 'labelEs' | 'labelEn'>>) {
    startTransition(() =>
      updateFrameMeta(f.id, {
        timecode: patch.timecode ?? f.timecode,
        labelEs: patch.labelEs ?? f.labelEs,
        labelEn: patch.labelEn ?? f.labelEn,
      })
    )
  }

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
            <FileButton name="file" accept="image/*" caption="Añadir frame" required />
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
        <SortableArea ids={ids} sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ids.map((id) => {
              const f = byId.get(id)
              if (!f) return null
              return (
                <SortableItem key={id} id={id}>
                  {(handle) => (
                    <div className="flex gap-3 rounded border border-border bg-bg/40 p-3">
                      <div className="flex flex-col items-center gap-2">
                        <DragHandle handle={handle} />
                      </div>
                      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded">
                        <Image src={f.thumb} alt="" fill sizes="128px" className="object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex gap-2">
                          <TextInput
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={f.timecode}
                            title="Timecode (s)"
                            className="w-24 py-1.5 text-xs"
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (v !== f.timecode) saveMeta(f, { timecode: v })
                            }}
                          />
                          <TextInput
                            defaultValue={f.labelEs}
                            placeholder="Etiqueta (ES)"
                            className="py-1.5 text-xs"
                            onBlur={(e) => {
                              if (e.target.value !== f.labelEs)
                                saveMeta(f, { labelEs: e.target.value })
                            }}
                          />
                        </div>
                        <TextInput
                          defaultValue={f.labelEn}
                          placeholder="Label (EN)"
                          className="py-1.5 text-xs"
                          onBlur={(e) => {
                            if (e.target.value !== f.labelEn)
                              saveMeta(f, { labelEn: e.target.value })
                          }}
                        />
                        <div className="mt-auto flex items-center gap-3 text-[10px] uppercase tracking-wider">
                          <button
                            disabled={pending}
                            onClick={() =>
                              startTransition(() => toggleFramePublished(f.id, !f.published))
                            }
                            className={`hover:underline disabled:opacity-40 ${
                              f.published ? 'text-green-400' : 'text-muted'
                            }`}
                          >
                            {f.published ? 'Público' : 'Interno'}
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => startTransition(() => deleteFrame(f.id))}
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
