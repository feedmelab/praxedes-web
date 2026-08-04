import { PageHeader } from '../_components/ui'
import { TEMPLATE_KEYS, TEMPLATE_LABELS, TEMPLATE_VARS, getTemplate } from '@/lib/email-templates'
import EmailTemplatesForm from './EmailTemplatesForm'

export const metadata = { title: 'Emails' }

export default async function EmailsPage() {
  const templates = await Promise.all(
    TEMPLATE_KEYS.map(async (key) => ({
      key,
      label: TEMPLATE_LABELS[key],
      ...(await getTemplate(key)),
    }))
  )

  return (
    <div>
      <PageHeader title="Plantillas de email" />
      <p className="mb-6 max-w-[60ch] text-sm text-muted">
        Textos de los correos automáticos del archivo. Puedes usar estas variables, que se
        sustituyen al enviar: <code className="text-accent">{TEMPLATE_VARS.join('  ')}</code>.
      </p>
      <EmailTemplatesForm templates={templates} />
    </div>
  )
}
