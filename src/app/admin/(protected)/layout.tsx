import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

// Guard de autenticación para el panel. Se aplica a todas las páginas
// dentro de (protected) pero NO a /admin/login.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return <>{children}</>
}
