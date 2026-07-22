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
