'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Permite que una página (p. ej. el detalle de un proyecto, cuya URL no coincide
// con ningún enlace del menú) fuerce qué sección del menú aparece activa.
const Ctx = createContext<{
  override: string | null
  setOverride: (v: string | null) => void
}>({ override: null, setOverride: () => {} })

export function NavSectionProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState<string | null>(null)
  return <Ctx.Provider value={{ override, setOverride }}>{children}</Ctx.Provider>
}

export function useNavSection() {
  return useContext(Ctx)
}

// Renderízalo dentro de una página para marcar como activo el enlace `href` del
// menú mientras esa página esté montada.
export function SetNavSection({ href }: { href: string }) {
  const { setOverride } = useNavSection()
  useEffect(() => {
    setOverride(href)
    return () => setOverride(null)
  }, [href, setOverride])
  return null
}
