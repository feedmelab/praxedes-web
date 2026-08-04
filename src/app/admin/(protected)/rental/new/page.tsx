import { PageHeader, Card } from '../../_components/ui'
import RentalForm from '../RentalForm'
import { createRentalItem } from '../actions'

export const metadata = { title: 'Nueva pieza' }

export default function NewRentalPage() {
  async function action(_prev: { error?: string } | null, fd: FormData) {
    'use server'
    return createRentalItem(fd)
  }

  return (
    <div>
      <PageHeader title="Nueva pieza" back={{ href: '/admin/rental', label: 'Archivo' }} />
      <Card>
        <RentalForm action={action} submitLabel="Crear pieza" />
      </Card>
      <p className="mt-4 text-[11px] text-muted">
        Podrás añadir imágenes después de crear la pieza.
      </p>
    </div>
  )
}
