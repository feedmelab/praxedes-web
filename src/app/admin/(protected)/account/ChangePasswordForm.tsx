'use client'

import { useActionState, useRef, useEffect } from 'react'
import { Field, TextInput } from '../_components/ui'
import SubmitButton from '../_components/SubmitButton'
import { changePassword } from './actions'

export default function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="max-w-sm space-y-6">
      <Field label="Contraseña actual">
        <TextInput name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Nueva contraseña" hint="Mínimo 8 caracteres">
        <TextInput name="next" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Repetir nueva contraseña">
        <TextInput name="confirm" type="password" autoComplete="new-password" required />
      </Field>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-xs text-green-400">Contraseña actualizada.</p>}

      <div className="pt-2">
        <SubmitButton pendingText="Guardando…">Cambiar contraseña</SubmitButton>
      </div>
    </form>
  )
}
