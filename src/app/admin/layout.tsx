import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: { template: '%s | Admin', default: 'Admin' },
  robots: { index: false, follow: false }, // nunca indexar el panel
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {children}
    </div>
  )
}
