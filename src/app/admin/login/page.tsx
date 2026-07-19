import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export const metadata = { title: 'Acceso' }

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/admin')

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-2xl tracking-widest text-accent uppercase">
            Práxedes de Vilallonga
          </h1>
          <p className="text-xs text-muted tracking-widest uppercase mt-2">
            Panel de administración
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
