import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email    = process.env.ADMIN_EMAIL    ?? 'admin@praxedesdevilallonga.com'
  const password = process.env.ADMIN_PASSWORD ?? 'change-this-password'

  const hash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where:  { email },
    update: { password: hash },
    create: { email, password: hash, name: 'Práxedes' },
  })
  console.log(`✓ Admin: ${user.email}`)

  await prisma.siteSettings.upsert({
    where:  { id: 'singleton' },
    update: {},
    create: {
      id:           'singleton',
      claimEs:      'Estilista · Diseñadora de vestuario · Costume rental',
      claimEn:      'Stylist · Costume designer · Costume rental',
      contactEmail: email,
    },
  })
  console.log('✓ Site settings inicializadas')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
