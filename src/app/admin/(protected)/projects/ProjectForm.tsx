'use client'

import { useActionState } from 'react'
import { Field, TextInput, TextArea, SelectInput } from '../_components/ui'
import SubmitButton from '../_components/SubmitButton'
import { PROJECT_CATEGORIES } from './labels'

type State = { error?: string; ok?: boolean } | null

type Defaults = {
  category?: string
  client?: string
  year?: number
  titleEs?: string
  titleEn?: string
  descEs?: string | null
  descEn?: string | null
  vimeoId?: string | null
}

export default function ProjectForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>
  defaults?: Defaults
  submitLabel: string
}) {
  const [state, formAction] = useActionState<State, FormData>(action, null)
  const d = defaults ?? {}

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Categoría">
          <SelectInput name="category" defaultValue={d.category ?? 'COMMERCIALS'} required>
            {Object.entries(PROJECT_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Año">
          <TextInput
            name="year"
            type="number"
            defaultValue={d.year ?? new Date().getFullYear()}
            required
          />
        </Field>
      </div>

      <Field label="Cliente">
        <TextInput name="client" defaultValue={d.client ?? ''} required />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Título (ES)">
          <TextInput name="titleEs" defaultValue={d.titleEs ?? ''} required />
        </Field>
        <Field label="Título (EN)">
          <TextInput name="titleEn" defaultValue={d.titleEn ?? ''} required />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Descripción (ES)">
          <TextArea name="descEs" defaultValue={d.descEs ?? ''} />
        </Field>
        <Field label="Descripción (EN)">
          <TextArea name="descEn" defaultValue={d.descEn ?? ''} />
        </Field>
      </div>

      <Field label="Vimeo ID" hint="Solo el identificador numérico del vídeo">
        <TextInput name="vimeoId" defaultValue={d.vimeoId ?? ''} placeholder="123456789" />
      </Field>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-xs text-green-400">Guardado.</p>}

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton pendingText="Guardando…">{submitLabel}</SubmitButton>
      </div>
    </form>
  )
}
