'use client'

import { useActionState } from 'react'
import { Field, TextInput, TextArea, Card } from '../_components/ui'
import SubmitButton from '../_components/SubmitButton'
import { updateEmailTemplates } from './actions'

type Template = {
  key: string
  label: string
  subjectEs: string
  bodyEs: string
  subjectEn: string
  bodyEn: string
}

export default function EmailTemplatesForm({ templates }: { templates: Template[] }) {
  const [state, formAction] = useActionState(updateEmailTemplates, null)

  return (
    <form action={formAction} className="space-y-8">
      {templates.map((t) => (
        <Card key={t.key}>
          <h2 className="mb-5 text-[11px] uppercase tracking-[0.2em] text-accent">{t.label}</h2>

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Asunto (ES)">
                <TextInput name={`${t.key}__subjectEs`} defaultValue={t.subjectEs} />
              </Field>
              <Field label="Asunto (EN)">
                <TextInput name={`${t.key}__subjectEn`} defaultValue={t.subjectEn} />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Cuerpo (ES)">
                <TextArea
                  name={`${t.key}__bodyEs`}
                  defaultValue={t.bodyEs}
                  className="min-h-[11rem] font-mono text-[13px]"
                />
              </Field>
              <Field label="Cuerpo (EN)">
                <TextArea
                  name={`${t.key}__bodyEn`}
                  defaultValue={t.bodyEn}
                  className="min-h-[11rem] font-mono text-[13px]"
                />
              </Field>
            </div>
          </div>
        </Card>
      ))}

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-xs text-green-400">Plantillas guardadas.</p>}

      <div className="pt-1">
        <SubmitButton pendingText="Guardando…">Guardar plantillas</SubmitButton>
      </div>
    </form>
  )
}
