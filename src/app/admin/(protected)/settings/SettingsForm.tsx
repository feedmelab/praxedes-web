'use client'

import { useActionState } from 'react'
import { Field, TextInput, TextArea, Card } from '../_components/ui'
import SubmitButton from '../_components/SubmitButton'
import { updateSettings } from './actions'
import { EFFECT_COLORS_DEFAULT } from '@/lib/effect-colors'

function ColorField({
  label,
  name,
  value,
  hint,
}: {
  label: string
  name: string
  value: string
  hint: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-soft">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          name={name}
          defaultValue={value}
          className="h-10 w-14 cursor-pointer rounded border border-border bg-surface p-1"
        />
        <span className="font-mono text-xs text-muted">{value}</span>
      </div>
      <p className="mt-1.5 text-[11px] text-muted">{hint}</p>
    </div>
  )
}

type Settings = {
  reelVimeoId?: string | null
  reelMp4Url?: string | null
  claimEs?: string | null
  claimEn?: string | null
  aboutTitleEs?: string | null
  aboutTitleEn?: string | null
  homeIntroEs?: string | null
  homeIntroEn?: string | null
  bioEs?: string | null
  bioEn?: string | null
  micInfoEs?: string | null
  micInfoEn?: string | null
  clientsList?: string | null
  effectBase?: string | null
  effectAccent?: string | null
  contactEmail?: string | null
  instagramUrl?: string | null
  vimeoUrl?: string | null
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <header className="mb-6 border-b border-border pb-4">
      <h2 className="text-[11px] uppercase tracking-[0.2em] text-accent">{title}</h2>
      <p className="mt-1.5 text-[12px] text-muted">{desc}</p>
    </header>
  )
}

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useActionState(updateSettings, null)
  const s = settings

  return (
    <form action={formAction} className="space-y-10">
      <Card>
        <SectionHead title="Portada" desc="Vídeo de fondo (reel) y claim de la home." />
        <div className="space-y-6">
          <Field label="Reel — Vimeo ID" hint="Vídeo de fondo de la home (con ?h=… si es privado)">
            <TextInput
              name="reelVimeoId"
              defaultValue={s.reelVimeoId ?? ''}
              placeholder="123456789"
            />
          </Field>
          <Field
            label="Vídeo de fondo (MP4, opcional)"
            hint="Alternativa a Vimeo: URL directa de un .mp4. Si la rellenas, tiene prioridad sobre el reel."
          >
            <TextInput
              name="reelMp4Url"
              defaultValue={s.reelMp4Url ?? ''}
              placeholder="https://…/fondo.mp4"
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
        </div>
      </Card>

      <Card>
        <SectionHead
          title="Sección «Sobre mí» (home)"
          desc="Titular y párrafo breve del bloque «Sobre mí» de la portada."
        />
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Titular (ES)" hint="Título del bloque en la home">
              <TextInput
                name="aboutTitleEs"
                defaultValue={s.aboutTitleEs ?? ''}
                placeholder="Entre lo poético y lo radical"
              />
            </Field>
            <Field label="Titular (EN)" hint="Home block heading">
              <TextInput
                name="aboutTitleEn"
                defaultValue={s.aboutTitleEn ?? ''}
                placeholder="Between the poetic and the radical"
              />
            </Field>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Texto breve (ES)" hint="Párrafo corto del teaser">
              <TextArea
                name="homeIntroEs"
                defaultValue={s.homeIntroEs ?? ''}
                className="min-h-[7rem]"
              />
            </Field>
            <Field label="Texto breve (EN)" hint="Short teaser paragraph">
              <TextArea
                name="homeIntroEn"
                defaultValue={s.homeIntroEn ?? ''}
                className="min-h-[7rem]"
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHead
          title="Biografía (página «Sobre mí»)"
          desc="Texto completo que aparece en la página Sobre mí."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Bio (ES)">
            <TextArea name="bioEs" defaultValue={s.bioEs ?? ''} className="min-h-[12rem]" />
          </Field>
          <Field label="Bio (EN)">
            <TextArea name="bioEn" defaultValue={s.bioEn ?? ''} className="min-h-[12rem]" />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHead
          title="Clientes seleccionados (home)"
          desc="Lista opcional; si la dejas vacía, los clientes salen de los proyectos."
        />
        <Field
          label="Clientes (uno por línea)"
          hint="En la home se muestran unos cuantos al azar en cada carga."
        >
          <TextArea
            name="clientsList"
            defaultValue={s.clientsList ?? ''}
            className="min-h-[9rem]"
            placeholder={'Lamborghini\nNike\nCoca-Cola\n…'}
          />
        </Field>
      </Card>

      <Card>
        <SectionHead
          title="Aviso del micrófono (home)"
          desc="Nota de privacidad que se abre desde el icono de micro en la portada."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Texto (ES)">
            <TextArea name="micInfoEs" defaultValue={s.micInfoEs ?? ''} className="min-h-[10rem]" />
          </Field>
          <Field label="Texto (EN)">
            <TextArea name="micInfoEn" defaultValue={s.micInfoEn ?? ''} className="min-h-[10rem]" />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHead
          title="Colores del efecto del nombre (home)"
          desc="Gama del efecto WebGL: color base en reposo y color de acento que aparece con el sonido."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <ColorField
            label="Color base"
            name="effectBase"
            value={s.effectBase ?? EFFECT_COLORS_DEFAULT.base}
            hint="Color del nombre en reposo (marfil por defecto)."
          />
          <ColorField
            label="Color de acento"
            name="effectAccent"
            value={s.effectAccent ?? EFFECT_COLORS_DEFAULT.accent}
            hint="Tinte que aparece con el sonido (dorado por defecto)."
          />
        </div>
      </Card>

      <Card>
        <SectionHead title="Contacto y redes" desc="Email de contacto y enlaces sociales." />
        <div className="space-y-6">
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
        </div>
      </Card>

      <div className="sticky bottom-4 flex items-center gap-4 rounded border border-border bg-bg/90 px-4 py-3 backdrop-blur">
        <SubmitButton pendingText="Guardando…">Guardar ajustes</SubmitButton>
        {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
        {state?.ok && <p className="text-xs text-green-400">Ajustes guardados.</p>}
      </div>
    </form>
  )
}
