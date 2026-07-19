'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd  = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      email:    fd.get('email'),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-surface border border-border rounded px-4 py-3 text-sm
                     text-light focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full bg-surface border border-border rounded px-4 py-3 text-sm
                     text-light focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 pt-1">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent text-[#0a0a0a] text-sm font-semibold py-3 rounded
                   hover:bg-[#d4b87a] transition-colors disabled:opacity-50 mt-2
                   tracking-wide uppercase"
      >
        {loading ? 'Entrando…' : 'Acceder'}
      </button>
    </form>
  )
}
