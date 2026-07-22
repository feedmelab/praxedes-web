'use client'

import { useEffect } from 'react'

// El <html lang> lo fija el layout raíz en "es". En las páginas en inglés lo
// corregimos en cliente para accesibilidad y señales de idioma correctas.
export default function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return null
}
