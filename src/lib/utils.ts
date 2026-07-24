import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatTimecode(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

/**
 * Extrae el ID y el hash de privacidad de lo que el usuario ponga en el campo
 * de Vimeo: "76979871", "76979871?h=abc123", "76979871/abc123",
 * "https://vimeo.com/76979871/abc123", "https://vimeo.com/76979871?h=abc123",
 * "https://player.vimeo.com/video/76979871?h=abc123".
 * Casi todos los vídeos de Vimeo (desde 2021) necesitan el hash para embeberse.
 */
export function parseVimeo(input: string): { id: string; hash?: string } {
  const s = (input || '').trim()
  const id = s.match(/(?:vimeo\.com\/(?:video\/)?)?(\d{6,})/)?.[1] ?? s
  const hashQuery = s.match(/[?&]h=([0-9a-zA-Z]+)/)?.[1]
  const hashPath = s.match(/\d{6,}\/([0-9a-zA-Z]+)/)?.[1]
  return { id, hash: hashQuery || hashPath || undefined }
}

/**
 * Parsea un timecode escrito a mano a segundos. Admite "ss", "ss.mmm",
 * "mm:ss", "mm:ss.mmm" y "hh:mm:ss.mmm". Devuelve null si el formato no es
 * válido.
 */
export function parseTimecode(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parts = trimmed.split(':')
  if (parts.length > 3 || parts.some((p) => p === '' || !/^\d+(\.\d+)?$/.test(p))) return null

  const nums = parts.map(Number)
  let seconds = 0
  if (nums.length === 3) seconds = nums[0] * 3600 + nums[1] * 60 + nums[2]
  else if (nums.length === 2) seconds = nums[0] * 60 + nums[1]
  else seconds = nums[0]

  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}
