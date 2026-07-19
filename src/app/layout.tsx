import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

const cormorant = Cormorant_Garamond({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600'],
  style:    ['normal', 'italic'],
  variable: '--font-cormorant',
  display:  'swap',
})

const jetbrains = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500'],
  variable: '--font-jetbrains',
  display:  'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praxedesdevilallonga.com'),
  title: {
    default:  'Práxedes de Vilallonga — Estilista & Costume Designer',
    template: '%s | Práxedes de Vilallonga',
  },
  description:
    'Estilista y diseñadora de vestuario con base en Barcelona. ' +
    'Publicidad, cine y televisión.',
  openGraph: {
    siteName:        'Práxedes de Vilallonga',
    locale:          'es_ES',
    alternateLocale: 'en_US',
    type:            'website',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${cormorant.variable} ${jetbrains.variable}`}
    >
      <body className="bg-bg text-light antialiased">
        {children}
      </body>
    </html>
  )
}
