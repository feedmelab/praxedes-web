'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      className="rounded border border-border px-3 py-2 text-xs uppercase tracking-wider text-muted transition-colors hover:text-light"
    >
      Cerrar sesión
    </button>
  )
}
