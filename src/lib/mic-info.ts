// Texto por defecto del aviso del micrófono (editable desde Ajustes) y las
// etiquetas de encabezado/cerrar por idioma.
export const MIC_INFO_DEFAULT: Record<'es' | 'en', string> = {
  es:
    'Dale voz a la portada: si activas el micrófono, el nombre cobra vida y fluye con tu voz — háblale, susúrrale o pon música y verás cómo respira con el sonido.\n\n' +
    'Todo ocurre en tu navegador, al vuelo: el audio solo mide su intensidad para animar las letras. No se graba, no se transcribe, no se envía a ningún servidor y no se guarda nada. Es opcional; sin permiso, la web funciona igual.',
  en:
    'Give the cover a voice: turn on the microphone and the name comes alive and flows with your voice — speak, whisper, or play music and watch it breathe with the sound.\n\n' +
    'It all happens in your browser, on the fly: the audio is only measured for loudness to animate the letters. Nothing is recorded, transcribed, sent to any server, or stored. It’s optional; without permission the site works just the same.',
}

export const MIC_INFO_LABELS: Record<'es' | 'en', { title: string; close: string }> = {
  es: { title: 'Sobre el micrófono', close: 'Cerrar' },
  en: { title: 'About the microphone', close: 'Close' },
}
