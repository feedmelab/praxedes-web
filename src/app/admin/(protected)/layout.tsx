import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminNav from './_components/AdminNav'

// Guard de autenticación para el panel. Se aplica a todas las páginas
// dentro de (protected) pero NO a /admin/login.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </>
  )
}
