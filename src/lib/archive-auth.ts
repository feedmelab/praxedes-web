// Acceso privado al «Archivo»: cuentas por cliente (email + clave) gestionadas
// desde el admin. Sesión mediante cookie httpOnly firmada con HMAC (sin
// dependencias extra). El hash de la contraseña usa bcrypt.
import { cookies } from 'next/headers'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const COOKIE = 'px_archive'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 días

function secret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.ARCHIVE_SECRET || ''
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10)
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}

type Payload = { uid: string; email: string; exp: number }

function sign(payload: Payload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(data).digest('base64url')
  return `${data}.${sig}`
}
function verify(token: string): Payload | null {
  const [data, sig] = token.split('.')
  if (!data || !sig) return null
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString()) as Payload
    if (!p.exp || p.exp < Date.now() / 1000) return null
    return p
  } catch {
    return null
  }
}

export async function setArchiveSession(user: { id: string; email: string }): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  const token = sign({ uid: user.id, email: user.email, exp })
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearArchiveSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

// Sesión válida = cookie firmada correcta Y usuario que sigue existiendo y
// activo en la base de datos.
export async function getArchiveSession(): Promise<{
  uid: string
  email: string
  name: string | null
} | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null
  const payload = verify(token)
  if (!payload) return null
  try {
    const row = await prisma.archiveUser.findUnique({ where: { id: payload.uid } })
    if (!row || !row.active) return null
    return { uid: row.id, email: row.email, name: row.name }
  } catch {
    return null
  }
}
