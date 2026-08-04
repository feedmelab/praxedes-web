'use client'

import { useActionState, useTransition } from 'react'
import { Card, Field, TextInput } from '../_components/ui'
import SubmitButton from '../_components/SubmitButton'
import {
  createArchiveUser,
  setArchiveUserActive,
  setArchiveUserPassword,
  deleteArchiveUser,
} from './actions'

export type ArchiveUserVM = {
  id: string
  email: string
  name: string | null
  active: boolean
  createdAt: string
}

export default function ArchiveUsersManager({ users }: { users: ArchiveUserVM[] }) {
  const [state, formAction] = useActionState(createArchiveUser, null)
  const [pending, start] = useTransition()

  function toggle(id: string, active: boolean) {
    start(() => setArchiveUserActive(id, active))
  }
  function resetPw(id: string) {
    const pw = prompt('Nueva contraseña (mínimo 6 caracteres):')
    if (!pw) return
    start(async () => {
      const res = await setArchiveUserPassword(id, pw)
      if (res?.error) alert(res.error)
    })
  }
  function remove(id: string, email: string) {
    if (!confirm(`¿Borrar el acceso de ${email}?`)) return
    start(() => deleteArchiveUser(id))
  }

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-accent">Nuevo acceso</h2>
        <form action={formAction} className="grid gap-4 sm:grid-cols-4">
          <Field label="Email">
            <TextInput name="email" type="email" required placeholder="cliente@correo.com" />
          </Field>
          <Field label="Nombre (opcional)">
            <TextInput name="name" placeholder="Nombre" />
          </Field>
          <Field label="Contraseña">
            <TextInput name="password" type="text" required placeholder="mín. 6 caracteres" />
          </Field>
          <div className="flex items-end">
            <SubmitButton pendingText="Creando…">Crear acceso</SubmitButton>
          </div>
        </form>
        {state?.error && <p className="mt-2 text-xs text-red-400">{state.error}</p>}
        {state?.ok && <p className="mt-2 text-xs text-green-400">Acceso creado.</p>}
      </Card>

      {users.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay usuarios con acceso al archivo.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-light">
                  {u.email}
                  {u.name ? <span className="ml-2 text-muted">· {u.name}</span> : null}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {u.active ? 'Activo' : 'Desactivado'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => toggle(u.id, !u.active)}
                  className="rounded-sm border border-border px-2.5 py-1 text-soft hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  {u.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => resetPw(u.id)}
                  className="rounded-sm border border-border px-2.5 py-1 text-soft hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  Cambiar clave
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(u.id, u.email)}
                  className="rounded-sm border border-red-500/40 px-2.5 py-1 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
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
