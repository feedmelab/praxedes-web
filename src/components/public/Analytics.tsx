import Script from 'next/script'

// Google Analytics 4. Solo se monta si NEXT_PUBLIC_GA_ID está definido, así
// que en desarrollo (sin la var) no carga nada.
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID
  if (!id) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  )
}
