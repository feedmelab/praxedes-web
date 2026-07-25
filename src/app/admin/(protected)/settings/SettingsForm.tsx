'use client'

import { useActionState } from 'react'
import { Field, TextInput, TextArea } from '../_components/ui'
import SubmitButton from '../_components/SubmitButton'
import { updateSettings } from './actions'

type Settings = {
  reelVimeoId?: string | null
  claimEs?: string | null
  claimEn?: string | null
  aboutTitleEs?: string | null
  aboutTitleEn?: string | null
  homeIntroEs?: string | null
  homeIntroEn?: string | null
  bioEs?: string | null
  bioEn?: string | null
  contactEmail?: string | null
  instagramUrl?: string | null
  vimeoUrl?: string | null
}

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState(updateSettings, null)
  const s = settings

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-6">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted">Portada</h2>
        <Field label="Reel — Vimeo ID" hint="Vídeo destacado de la home">
          <TextInput
            name="reelVimeoId"
            defaultValue={s.reelVimeoId ?? ''}
            placeholder="123456789"
          />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Claim (ES)">
            <TextInput name="claimEs" defaultValue={s.claimEs ?? ''} />
          </Field>
          <Field label="Claim (EN)">
            <TextInput name="claimEn" defaultValue={s.claimEn ?? ''} />
          </Field>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Sección «Sobre mí» (home)
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Titular (ES)" hint="Título de la sección «Sobre mí» de la home">
            <TextInput
              name="aboutTitleEs"
              defaultValue={s.aboutTitleEs ?? ''}
              placeholder="Entre lo poético y lo radical"
            />
          </Field>
          <Field label="Titular (EN)" hint="Home «About» section heading">
            <TextInput
              name="aboutTitleEn"
              defaultValue={s.aboutTitleEn ?? ''}
              placeholder="Between the poetic and the radical"
            />
          </Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Texto breve (ES)" hint="Párrafo corto del teaser de la home">
            <TextArea
              name="homeIntroEs"
              defaultValue={s.homeIntroEs ?? ''}
              className="min-h-[7rem]"
            />
          </Field>
          <Field label="Texto breve (EN)" hint="Short home teaser paragraph">
            <TextArea
              name="homeIntroEn"
              defaultValue={s.homeIntroEn ?? ''}
              className="min-h-[7rem]"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Biografía (página «Sobre mí»)
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Bio (ES)" hint="Texto completo de la página Sobre mí">
            <TextArea name="bioEs" defaultValue={s.bioEs ?? ''} className="min-h-[12rem]" />
          </Field>
          <Field label="Bio (EN)" hint="Full text of the About page">
            <TextArea name="bioEn" defaultValue={s.bioEn ?? ''} className="min-h-[12rem]" />
          </Field>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted">Contacto y redes</h2>
        <Field label="Email de contacto">
          <TextInput name="contactEmail" type="email" defaultValue={s.contactEmail ?? ''} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Instagram (URL)">
            <TextInput
              name="instagramUrl"
              defaultValue={s.instagramUrl ?? ''}
              placeholder="https://instagram.com/…"
            />
          </Field>
          <Field label="Vimeo (URL)">
            <TextInput
              name="vimeoUrl"
              defaultValue={s.vimeoUrl ?? ''}
              placeholder="https://vimeo.com/…"
            />
          </Field>
        </div>
      </section>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-xs text-green-400">Ajustes guardados.</p>}

      <div className="pt-2">
        <SubmitButton pendingText="Guardando…">Guardar ajustes</SubmitButton>
      </div>
    </form>
  )
}
