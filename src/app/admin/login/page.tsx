import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export const metadata = { title: 'Acceso' }

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/admin')

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[20rem] animate-fade-up">
        <div className="mb-14 text-center">
          <h1 className="font-display text-3xl leading-tight tracking-wide text-light">
            Práxedes
            <span className="block italic text-accent">de Vilallonga</span>
          </h1>
          <span className="mx-auto my-6 block h-px w-8 bg-accent/60" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
            Panel de administración
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
