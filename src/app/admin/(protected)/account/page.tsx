import { auth } from '@/lib/auth'
import { PageHeader, Card } from '../_components/ui'
import ChangePasswordForm from './ChangePasswordForm'

export const metadata = { title: 'Cuenta' }

export default async function AccountPage() {
  const session = await auth()

  return (
    <div>
      <PageHeader title="Cuenta" />
      <Card>
        <p className="mb-6 text-[11px] uppercase tracking-[0.2em] text-muted">
          {session?.user?.email}
        </p>
        <ChangePasswordForm />
      </Card>
    </div>
  )
}
