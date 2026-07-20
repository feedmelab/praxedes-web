'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      redirect: false,
    })

    setLoading(false)
    if (res?.error) {
      setError('Email o contraseña incorrectos')
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="group">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted transition-colors group-focus-within:text-accent">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border-b border-border bg-transparent py-2 text-sm text-light transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <div className="group">
        <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted transition-colors group-focus-within:text-accent">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border-b border-border bg-transparent py-2 text-sm text-light transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-xs tracking-wide text-red-400/90">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-sm border border-accent/50 py-3.5 text-xs font-medium uppercase tracking-[0.25em] text-accent transition-all duration-300 hover:bg-accent hover:text-bg disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-accent"
      >
        {loading ? 'Entrando…' : 'Acceder'}
      </button>
    </form>
  )
}
