// Colores por defecto del efecto WebGL del nombre.
// base = marfil de reposo; accent = color hacia el que tiñe con el sonido.
export const EFFECT_COLORS_DEFAULT = { base: '#f2ede6', accent: '#d1a85c' }

// '#rrggbb' → [r, g, b] en 0..1. Devuelve el fallback si no es válido.
export function hexToRgb01(hex: string | null | undefined, fallback: [number, number, number]) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec((hex || '').trim())
  if (!m) return fallback
  const n = parseInt(m[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as [
    number,
    number,
    number,
  ]
}
