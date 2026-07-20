import { PageHeader, Card } from '../../_components/ui'
import ProjectForm from '../ProjectForm'
import { createProject } from '../actions'

export const metadata = { title: 'Nuevo proyecto' }

export default function NewProjectPage() {
  async function action(_prev: { error?: string } | null, fd: FormData) {
    'use server'
    return createProject(fd)
  }

  return (
    <div>
      <PageHeader title="Nuevo proyecto" back={{ href: '/admin/projects', label: 'Proyectos' }} />
      <Card>
        <ProjectForm action={action} submitLabel="Crear proyecto" />
      </Card>
      <p className="mt-4 text-[11px] text-muted">
        Podrás añadir imágenes y frames después de crear el proyecto.
      </p>
    </div>
  )
}
