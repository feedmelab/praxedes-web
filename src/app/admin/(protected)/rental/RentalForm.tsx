'use client'

import { useActionState } from 'react'
import { Field, TextInput, TextArea, SelectInput } from '../_components/ui'
import SubmitButton from '../_components/SubmitButton'
import { RENTAL_CATEGORIES } from '../projects/labels'

type State = { error?: string; ok?: boolean } | null

type Defaults = {
  nameEs?: string
  nameEn?: string
  descEs?: string | null
  descEn?: string | null
  category?: string
}

export default function RentalForm({
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
        <Field label="Nombre (ES)">
          <TextInput name="nameEs" defaultValue={d.nameEs ?? ''} required />
        </Field>
        <Field label="Nombre (EN)">
          <TextInput name="nameEn" defaultValue={d.nameEn ?? ''} required />
        </Field>
      </div>

      <Field label="Categoría">
        <SelectInput name="category" defaultValue={d.category ?? 'PERIOD'} required>
          {Object.entries(RENTAL_CATEGORIES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Descripción (ES)">
          <TextArea name="descEs" defaultValue={d.descEs ?? ''} />
        </Field>
        <Field label="Descripción (EN)">
          <TextArea name="descEn" defaultValue={d.descEn ?? ''} />
        </Field>
      </div>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-xs text-green-400">Guardado.</p>}

      <div className="pt-2">
        <SubmitButton pendingText="Guardando…">{submitLabel}</SubmitButton>
      </div>
    </form>
  )
}
