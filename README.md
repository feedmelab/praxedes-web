# Práxedes de Vilallonga — Web

Stack: Next.js 15 · TypeScript · Tailwind · PostgreSQL (Neon) · Prisma · NextAuth v5 · ImageKit · Vercel

---

## Setup local

### 1. Requisitos

- Node.js 20+
- npm 10+

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales reales
```

### 4. Base de datos (Neon)

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear proyecto → rama `main` (producción) y `dev` (desarrollo)
3. Copiar ambas connection strings en `.env` (`DATABASE_URL` y `DIRECT_URL`)

```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas
npm run db:migrate

# Crear usuario admin inicial
npm run db:seed
```

### 5. ImageKit

1. Crear cuenta en [imagekit.io](https://imagekit.io)
2. Ir a Settings → API Keys
3. Copiar Public Key, Private Key y URL Endpoint en `.env`
4. En ImageKit → Settings → Restrictions → habilitar signed URLs

### 6. Arrancar

```bash
npm run dev
# http://localhost:3000       → web pública (aún vacía en módulo A)
# http://localhost:3000/admin → panel admin (login)
```

---

## Deploy en Vercel

### 1. Conectar repo

1. Ir a [vercel.com](https://vercel.com) → New Project
2. Importar el repo de GitHub
3. Framework: Next.js (autodetectado)

### 2. Variables de entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables, añadir todas las variables de `.env.example` con valores de producción.

> **Importante:** Usar la branch `dev` de Neon para `Preview` y la branch `main` para `Production`.

### 3. Dominio

1. Vercel → Settings → Domains
2. Añadir `praxedesdevilallonga.com`
3. Añadir `admin.praxedesdevilallonga.com` → apuntar a `/admin`
4. Actualizar DNS en el registrador de dominio

### 4. Deploy

```bash
git push origin main  # → deploy automático en Vercel
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── admin/              # Panel de administración
│   │   └── login/          # Login
│   ├── api/
│   │   └── auth/           # NextAuth handlers
│   └── (public)/           # Web pública (módulo C)
│       └── [locale]/
├── components/
│   ├── admin/
│   ├── public/
│   └── shared/
├── i18n/                   # next-intl config
├── lib/
│   ├── auth.ts             # NextAuth
│   ├── prisma.ts           # DB client
│   ├── imagekit.ts         # Media + signed URLs
│   └── utils.ts
├── types/
└── middleware.ts
messages/
├── es.json
└── en.json
prisma/
├── schema.prisma
└── seed.ts
```

---

## Definition of Done — Módulo A

- [x] Repo GitHub privado con rama `main` protegida
- [x] Rama `develop` como rama de trabajo
- [x] `.gitignore` correcto
- [x] `README.md` con instrucciones
- [x] `npm run dev` funciona con `.env.example`
- [x] Schema de Prisma completo
- [x] Seed con usuario admin
- [x] NextAuth configurado con login seguro
- [x] Rate limiting en `/admin/login`
- [x] Security headers en `next.config.ts`
- [x] ImageKit configurado con signed URLs
- [x] Vercel conectado al repo
- [x] Dominio + SSL configurado
- [x] ESLint + Prettier + Husky
- [x] TypeScript en modo strict

---

## Módulos

| Módulo                | Estado                                            |
| --------------------- | ------------------------------------------------- |
| A · Infraestructura   | ✅ Completo                                       |
| B · Panel admin       | ✅ Completo (falta spike Vimeo con cuenta Pro)    |
| C · Web pública       | ✅ Completo (pendiente volcado de contenido real) |
| D · Formación         | 🔜 Pendiente                                      |
| E · Reservas alquiler | ✅ Implementado (requiere `npm run db:migrate`)   |
