import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUploadAuth } from '@/lib/imagekit'

// Devuelve los parámetros de autenticación para subir directamente a ImageKit
// desde el navegador. Requiere sesión de admin.
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    return NextResponse.json(getUploadAuth())
  } catch {
    return NextResponse.json({ error: 'ImageKit no configurado' }, { status: 500 })
  }
}
