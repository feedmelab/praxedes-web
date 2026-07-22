# SPEC — Módulo C: Web pública

> Estado: alcance validado + dirección visual aprobada (mockup, 22 jul 2026).
> Alineado con el brief del cliente (`Brief_Web_PraxedesDeVilallonga`, jun
> 2026). Requiere módulos A y B.

## 0. Dirección visual — APROBADA (mockup)

Mockups en `docs/mockups/home.html` y `docs/mockups/proyecto.html` revisados y
aprobados. Decisiones que quedan fijadas:

- **Paleta**: los tokens ya definidos en `tailwind.config.ts` — fondo `#0a0a0a`,
  surface `#111`, border `#222`, muted/soft/light grises, **acento oro/arena
  `#c8a96e`** (confirmado; el brief lo dejaba "a definir").
- **Tipografía**: Inter (cuerpo/nav) + Cormorant Garamond (display, nombre y
  grandes títulos). Ya en la config.
- **Interacciones**: parallax sutil del hero, reveal suave de tarjetas al
  scroll (IntersectionObserver + `fade-up`/out-expo), hover que revela
  cliente/título/año, switch ES/EN en el nav. Nada agresivo.
- **Perfil**: la web posiciona a Práxedes como **estilista / diseñadora de
  vestuario**. La herramienta de frames es documentación interna para mostrar
  el vestuario en contexto, no parte de su perfil profesional.

Siguiente paso: trasladar el mockup a páginas Next.js reales (ver §8).

## 1. Objetivo

Portfolio público (`praxedesdevilallonga.com`) para Práxedes de Vilallonga —
estilista y diseñadora de vestuario. Presenta su trabajo (publicidad, cine/TV,
galería) y el negocio de alquiler de vestuario ante directores de arte,
productoras y agencias. Todo el contenido nace en el panel admin (módulo B);
sin backoffice adicional.

Prioridad del cliente (nota final del brief): **el diseño visual es lo más
importante** — "la web va a ser juzgada en primer lugar por cómo se ve".
"Prefiero una web pequeña y muy bien ejecutada a una web grande mediocre."

## 2. Referencia y estética (del brief §2 y §4)

- **Referencia principal**: [bukistylist.com](https://bukistylist.com) —
  estética oscura, elegante, minimalista.
- **Paleta**: fondo muy oscuro (negro / gris carbón), tipografía y elementos
  en blanco o gris claro, posible color de acento sutil (a definir).
- **Tipografía**: sans-serif limpia y contemporánea, jerarquía clara, sin
  serifa ornamental.
- **Estilo**: minimalista, imágenes y vídeos como protagonistas, poco texto
  en la interfaz, espacios generosos.
- **Animación**: transiciones suaves entre páginas (fade/slide, nada brusco);
  hover sobre proyecto muestra cliente/descripción breve. **Parallax moderado
  como máximo, sin efectos de scroll agresivos.** La web debe sentirse rápida
  y no recargada.
- **Fotografía**: alta calidad, nada pixelado; apaisado preferido en vídeo,
  cuadrado/vertical admitido en galería.

> Nota: el cliente pide parallax **moderado y sutil**, no protagonista. La
> finura importa más que la cantidad de efecto.

## 3. Mapa del sitio (brief §3 + `messages/*.json` ya escritos)

| Ruta                         | Sección    | Fuente de datos                                        |
| ---------------------------- | ---------- | ------------------------------------------------------ |
| `/[locale]`                  | Home       | `SiteSettings` (reel, claim) + proyectos `featured`    |
| `/[locale]/publicidad`       | Publicidad | `Project` `category = COMMERCIALS`                     |
| `/[locale]/cine-tv`          | Cine y TV  | `Project` `category = FILM_TV`                         |
| `/[locale]/galeria`          | Galería    | `Project` `category = EDITORIAL` (imágenes fijas)      |
| `/[locale]/alquiler`         | Alquiler   | `RentalItem` (filtro por `RentalCategory`)             |
| `/[locale]/sobre-mi`         | Sobre mí   | Bio (ver §7, texto ya entregado ES/EN)                 |
| `/[locale]/contacto`         | Contacto   | Formulario → Resend                                    |
| `/[locale]/proyectos/[slug]` | Ficha      | `Project` + `ProjectImage[]` + `VideoFrame[]` públicos |

Slugs ES propuestos por mí a partir del nav — pendiente de confirmar (§6.1).
Footer: solo Vimeo e Instagram (brief §2), desde `SiteSettings`.

## 4. Páginas / componentes

- **Home**: reel Vimeo (`SiteSettings.reelVimeoId`) protagonista + nombre +
  claim + grid de proyectos destacados (`featured = true`). Presencia clara
  del nombre/marca desde la home (mejora que el cliente pide sobre Buki).
- **Listados por categoría**: grid de proyectos publicados, miniatura +
  nombre de cliente visible, hover con título/desc. Click → ficha.
- **Ficha de proyecto**: cliente, año, título, descripción, galería de
  `ProjectImage` (alt ES/EN) + sub-sección de `VideoFrame` publicados
  ("frames destacados" del brief §5) con etiqueta/timecode.
- **Galería**: imágenes fijas (looks, making of, detalle de vestuario).
- **Alquiler**: descripción del servicio, grid filtrable por categoría, ficha
  por prenda, CTA "Consultar disponibilidad" → contacto.
- **Sobre mí**: bio ES/EN + foto + clientes destacados.
- **Contacto**: formulario (nombre, email, mensaje) → **Resend** (Server
  Action, API key en servidor). Sin CAPTCHA agresivo. Necesita
  `RESEND_API_KEY` + dominio verificado en Resend.
- **Selector de idioma** ES/EN visible en el nav (next-intl, ya montado).

## 5. Requisitos técnicos (brief §7)

- **Responsive 100%**, prioridad móvil (muchos clientes ven portfolios en el
  teléfono). Vídeos con miniatura + reproducción inline en móvil.
- **Rendimiento**: PageSpeed 85+. Imágenes optimizadas automáticamente
  (ImageKit ya integrado — usar transformaciones on-the-fly).
- **SEO**: estructura semántica, meta tags editables por proyecto, sitemap
  XML automático, Open Graph con portadas.
- **Analytics**: Google Analytics 4 (o equivalente).
- **i18n**: ES/EN, ya integrado en el CMS (módulo B).

## 6. Abierto — confirmar antes de construir

1. **Slugs de ruta** ES (§3): `/publicidad`, `/cine-tv`, `/galeria`,
   `/alquiler`, `/sobre-mi`, `/contacto` — ¿ok o cambio alguno?
2. ~~**Color de acento**~~ — resuelto: oro/arena `#c8a96e` (§0).
3. **Presupuesto/horas** de este módulo (equivalente al PRX-202606 de B).
4. **Foto de "Sobre mí"** y **wordmark/logo PNG**: el cliente los aportará
   (brief §6) — ¿los tienes ya o los pedimos?

## 8. Plan de construcción (traslado del mockup a Next.js)

Orden por prioridad del brief (§10): primero Home + Publicidad + Sobre mí +
Contacto; luego el resto. La herramienta de frames ya está en el módulo B.

**Fase 1 — armazón y estilo**

- Layout público en `src/app/(public)/[locale]/layout.tsx`: nav (wordmark +
  links + switch idioma), footer (Vimeo/Instagram desde `SiteSettings`).
- Componentes compartidos en `src/components/public/` (Nav, Footer,
  LanguageSwitch, ProjectCard, RevealOnScroll, SubtleParallax).
- Confirmar que la paleta/fuentes del mockup ya están cableadas vía las vars
  de fuente (`--font-inter`, `--font-cormorant`) en el layout raíz.

**Fase 2 — Home + listados + ficha**

- Home: reel (`SiteSettings.reelVimeoId`), claim, grid de `featured`.
- Listados `/publicidad`, `/cine-tv`, `/galeria`: query Prisma por categoría,
  solo `published`, orden por `order`.
- Ficha `/proyectos/[slug]`: proyecto + `ProjectImage[]` + `VideoFrame[]`
  con `published = true`. `generateStaticParams` para prerender.

**Fase 3 — Sobre mí + Contacto + Alquiler**

- Sobre mí: bio ES/EN + clientes + foto.
- Contacto: form → Server Action con **Resend** (validación Zod, honeypot en
  vez de CAPTCHA agresivo). `RESEND_API_KEY` en env, dominio verificado.
- Alquiler: grid filtrable por `RentalCategory`, ficha por prenda, CTA →
  contacto.

**Fase 4 — SEO, performance, analítica**

- `generateMetadata` por página/proyecto (title, description, Open Graph con
  la portada vía ImageKit).
- `sitemap.ts` y `robots.ts` dinámicos (proyectos publicados + estáticas).
- Imágenes con `next/image` + loader de ImageKit (transformaciones y AVIF/WebP
  automáticos) para PageSpeed 85+.
- Google Analytics 4 (`@next/third-parties`), con consentimiento de cookies
  mínimo.

**Fase 5 — volcado de contenido y revisión**

- Cargar material real (vídeos, fotos, bio, proyectos) vía el panel admin.
- Revisión responsive/UX, Lighthouse, y merge `develop` → `main` (deploy prod).

## 9. Contenido ya entregado por el cliente (brief §9)

Bio ES/EN redactada (integrar en `SiteSettings.bioEs/bioEn` vía admin) y lista
de clientes destacados: Lamborghini · Jeep · Nissan · Citroën · Nike ·
Decathlon · Nestlé · Schweppes · Coca-Cola · Pacifiction (cine, 2020).

Pendiente de recibir: vídeos (Vimeo/archivos), fotos en alta, wordmark PNG,
lista completa de proyectos (cliente, año, categoría).
