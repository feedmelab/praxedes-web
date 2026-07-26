// Encuadre del recorte de una imagen (object-position). Compartido entre la web
// pública y el panel. Por defecto TOP para no cortar cabezas en los retratos.
export type Focal = 'TOP' | 'CENTER' | 'BOTTOM'

export const FOCALS: Focal[] = ['TOP', 'CENTER', 'BOTTOM']

export const FOCAL_LABEL: Record<Focal, string> = {
  TOP: 'Arriba',
  CENTER: 'Centro',
  BOTTOM: 'Abajo',
}

/** Clase Tailwind de object-position según el encuadre. */
export function focalClass(f?: Focal | null): string {
  if (f === 'CENTER') return 'object-center'
  if (f === 'BOTTOM') return 'object-bottom'
  return 'object-top'
}
