import { createLocalizedPathnamesNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Navegación localizada: <Link href="/about" /> se resuelve a /sobre-mi (es) o
// /about (en) automáticamente según el locale activo.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createLocalizedPathnamesNavigation(routing)
