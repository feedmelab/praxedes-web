# SPEC — Módulo B: Panel de administración

> Presupuesto PRX-202606 · 1.440€ · 48h · Requiere módulo A
> Estado: en curso · Pendiente de validación

## 1. Objetivo

Panel privado para que Práxedes gestione proyectos, imágenes y vídeos **sin tocar
código**. La pieza diferenciadora del módulo es la **herramienta de extracción de
fotogramas de vídeos Vimeo privados**.

## 2. Alcance (6 features del presupuesto)

| #   | Feature                                     | Estado       |
| --- | ------------------------------------------- | ------------ |
| 1   | Login seguro (`admin.dominio.com`)          | ✅ Hecho     |
| 2   | Gestión de proyectos con imágenes           | ✅ Hecho     |
| 3   | Subida de imágenes a ImageKit               | ✅ Hecho     |
| 4   | **Herramienta extracción fotogramas Vimeo** | ❌ Pendiente |
| 5   | Gestión de vestuario de alquiler            | ✅ Hecho     |
| 6   | Ajustes generales del sitio                 | ✅ Hecho     |

Extras ya implementados (calidad, no facturables como alcance nuevo): reordenar
drag & drop, textos alt ES/EN, timecode + etiquetas de frames, cambio de
contraseña, enlaces de vista previa.

## 3. Estado actual detallado

Construido con **Server Actions + Zod**, componentes en `src/app/admin/(protected)/`.

- **Proyectos**: listar / crear / editar / borrar, publicar/destacar, gestor de
  imágenes (portada, alt ES/EN, reordenar), gestor de frames (subida manual,
  timecode, etiquetas, público/interno, reordenar).
- **Alquiler**: CRUD, disponibilidad, imágenes (JSON) con reordenar.
- **Ajustes**: singleton (reel, claims, bio, contacto, redes).
- **Cuenta**: cambio de contraseña.

## 3b. Extractor Vimeo único, dos vías (actualización jul 2026)

Un solo extractor (`VimeoCapture`) sobre el `vimeoId` del proyecto. Captura por
canvas y guarda el frame en ImageKit vía `addFrame`. Resuelve la fuente solo:

1. **Vídeo público/libre — sin token ni cuenta.** Usa el `config` del
   reproductor público de Vimeo (`player.vimeo.com/video/{id}/config`), que
   expone el MP4 progresivo, y captura por el proxy same-origin. Funciona con
   cualquier vídeo público/embebible.
2. **Vídeo privado de la cuenta de Práxedes — con `VIMEO_ACCESS_TOKEN`.** API de
   la cuenta propietaria (Pro). Necesario solo para privados con restricción de
   dominio.

Prioridad en `getVimeoMeta`: si hay token y da ficheros → API (privados); si no
→ config público (públicos); si nada funciona → error claro. No hay extractor
de archivo local.

## 4. Herramienta de extracción de fotogramas Vimeo (núcleo pendiente)

### 4.1 Qué debe hacer

Desde la edición de un proyecto con `vimeoId`, Práxedes debe poder:

1. Cargar el vídeo Vimeo **privado** dentro del panel.
2. Navegar (scrub) por el vídeo y/o introducir un timecode exacto.
3. Capturar el fotograma en ese instante como imagen de alta calidad.
4. Guardarlo en ImageKit y asociarlo al proyecto como `VideoFrame` (modelo ya
   existente: `fileId, url, width, height, timecode, labelEs/En, published, order`).

El resultado reutiliza el `FrameManager` y la galería pública del módulo C.

### 4.2 Base: prototipo validado en claude.ai

Ya existe un prototipo funcional (`vimeo-frame-extractor.html`) que valida el
enfoque y fija la forma exacta de la Vimeo API. De ahí se adopta:

- **Navegación con el Vimeo Player SDK** (`player.js`, iframe): scrub, salto de
  ±1 fotograma, ±1/±5 s, play/pausa, "ir a timecode" y atajos de teclado
  (←/→ fotograma, espacio play, C capturar). Buena UX y funciona con vídeos
  privados.
- **Captura de alta calidad**: `GET /videos/{id}?fields=files,width,height,name`
  → `files[]` ordenados por resolución → mejor `.link` (MP4) → `<video>` oculto →
  _seek_ al timecode → `canvas.drawImage` → blob.
- **Fallback**: si no hay acceso a `files` o falla CORS, miniatura (baja calidad).
- Formatos de exportación PNG / JPEG / WebP con calidad ajustable.

### 4.3 Adaptaciones para producción (deltas frente al prototipo)

El prototipo es cliente puro y expone el token; en el panel real cambia:

1. **Token en el servidor.** `VIMEO_ACCESS_TOKEN` en env. La resolución de `files`
   se hace en un route handler protegido `/api/admin/vimeo/[id]` que devuelve
   `{ fileUrl, width, height, duration }`. El token **nunca** llega al navegador.
2. **Player sin token en cliente.** Configurar en Vimeo el _domain-level privacy_
   permitiendo el embed en `admin.praxedesdevilallonga.com`, así el Player SDK
   reproduce el privado sin pasar token al cliente.
3. **Proxy same-origin para la captura.** `/api/admin/vimeo/[id]/file` reenvía el
   MP4 con soporte `Range`. Evita el _canvas tainted_ por CORS (riesgo real del
   prototipo, que cae a miniatura) y mantiene el token oculto. `Range` permite el
   _seek_ sin descargar el vídeo entero.
4. **Salida a ImageKit, no descarga.** El blob capturado se sube con una Server
   Action y se crea un `VideoFrame` del proyecto, integrado en el `FrameManager`
   existente (etiquetas, público/interno, orden). Nada de descargar/portapapeles.
5. **CSP**: `frame-src`/`script-src` ya permiten `player.vimeo.com`. Con el proxy,
   el `<video>` de captura es same-origin (`media-src 'self'`), así que no hace
   falta abrir dominios de CDN de Vimeo al cliente.

**Por qué este enfoque** (sin cambios respecto a la decisión original): sin ffmpeg
en serverless (frágil en Vercel), el trabajo pesado en el navegador de la admin, y
el token protegido en el servidor.

### 4.4 Alternativas descartadas

- **ffmpeg en Vercel Functions**: límites de tiempo/tamaño y sin binario nativo.
  Descartada por fiabilidad.
- **Token en el cliente (como el prototipo)**: expone el token de Vimeo en el
  navegador. Se mueve al servidor.
- **Canvas directo contra la URL de Vimeo (sin proxy)**: el `<canvas>` queda
  _tainted_ si el CDN no envía cabeceras CORS → `toBlob` falla (por eso el
  prototipo cae a miniatura). Se resuelve con el proxy same-origin.
- **API de thumbnails de Vimeo (`/videos/{id}/pictures`)**: solo genera el póster
  del vídeo, calidad limitada. Solo como último recurso.

### 4.5 Arquitectura

```
Navegación:  Vimeo Player SDK (iframe, domain-embed)  →  currentTime (t)

Captura:
  /api/admin/vimeo/[id]       ──(token env, server)──►  Vimeo API → { fileUrl, w, h, duration }
  /api/admin/vimeo/[id]/file  (proxy Range → CDN Vimeo, same-origin)
        │
        ▼
  Cliente: <video src=proxy> → seek(t) → <canvas> → blob
        │
        ▼
  Server Action addFrameFromCapture(projectId, blob, timecode)  →  ImageKit  →  VideoFrame
```

- **Navegación y captura desacopladas**: el player embebido sirve para localizar
  el instante; el `<video>` oculto (por proxy) hace la captura a resolución nativa.
- **Auth**: las rutas `/api/admin/**` se protegen con `auth()` como el resto del panel.
- **Datos**: no cambia el schema; se reutiliza `VideoFrame`.

### 4.6 Riesgos y validación previa (spike)

Antes de construir la UI final, un **spike** valida el punto de riesgo. Requiere
`VIMEO_ACCESS_TOKEN` real y un `vimeoId` privado real (aún no disponibles):

1. La Vimeo API devuelve `files` (MP4 progresivo) para ese vídeo con el token.
2. El domain-embed permite reproducir el privado en el player sin token cliente.
3. El proxy + `<video>` + `canvas.toBlob()` produce una imagen **no** _tainted_.

Plan B si el vídeo solo expone HLS (no MP4 progresivo): extraer del HLS en el
navegador (hls.js) o póster por timecode vía API como último recurso.

## 5. Definition of Done — Módulo B

**Proyectos**

- [x] CRUD de proyectos con validación
- [x] Publicar / destacar
- [x] Gestor de imágenes con subida a ImageKit
- [x] Portada, alt ES/EN, reordenar imágenes

**Extracción de fotogramas Vimeo** (fontanería lista; falta validar con token real)

- [x] Endpoint server de metadatos + modo (`/api/admin/vimeo/[id]`, token en env)
- [x] Proxy same-origin con soporte `Range`, protegido por sesión (`/file`)
- [x] Modo 'thumbnail' de respaldo vía Pictures API (`/thumb`) para planes sin
      MP4 progresivo — **compatible con o sin acceso a ficheros (Pro o no)**
- [x] Server Action para guardar el frame (canvas o miniatura) en ImageKit → `VideoFrame`
- [x] UI de captura: player SDK, scrub/seek, salto por fotograma, previsualizar
- [x] Integrado con el `FrameManager` existente (etiquetas, público/interno, orden)
- [x] Degradación controlada sin token (401 sin sesión, 501 `NO_TOKEN`)
- [ ] **Spike con `VIMEO_ACCESS_TOKEN` + vídeo real**: confirmar modo progresivo
      (canvas no _tainted_) y/o modo miniatura, y el domain-embed del player

**Alquiler**

- [x] CRUD + disponibilidad + imágenes + reordenar

**Ajustes**

- [x] Singleton con reel, claims, bio, contacto, redes

**Transversal**

- [x] Todas las rutas admin protegidas (guard + middleware)
- [x] `npm run build` pasa sin errores
- [x] `VIMEO_ACCESS_TOKEN` documentado en `.env.example`
- [ ] Cambiada la contraseña por defecto del seed
- [ ] Manual breve de uso del panel (se solapa con módulo D)

## 6. Fuera de alcance (módulo B)

- Páginas públicas / galería visible (módulo C).
- Edición de vídeo, recorte o retoque de los frames.
- Multiusuario / roles (solo una cuenta admin).

## 7. Lo que necesito para el spike / implementación

Bloqueantes (sin esto no se puede construir ni validar la extracción):

1. **`VIMEO_ACCESS_TOKEN`** de la cuenta Vimeo Pro con scopes `private`,
   `video_files`, `edit`, `upload` (developer.vimeo.com → My Apps →
   Authentication). El token debe pertenecer al propietario de los vídeos
   privados.
   - `upload` requiere aprobación manual de Vimeo (My Apps → Permissions →
     Upload Access → Request Additional Access → ticket de soporte), hasta 5
     días laborables.
   - **`video_files` (modo `progressive`) solo se sirve en cuentas Pro o
     superior** — con Free/Plus la API devuelve "Video File Access: upgrade
     your membership". Sin esto, y mientras `upload` esté en revisión, la
     herramienta no puede capturar en ningún modo.
   - **Estado real (21 jul 2026): la cuenta usada para las pruebas no es Pro.**
     Bloqueado hasta que la clienta (Práxedes) ceda acceso a una cuenta Vimeo
     Pro+ real para pruebas, o suba de plan la que se esté usando.
2. **Un `vimeoId` privado real** para el spike (uno de los vídeos de Práxedes).
3. **Domain-embed** en Vimeo: permitir el embed en
   `admin.praxedesdevilallonga.com` (y `localhost` para desarrollo) para que el
   player reproduzca privados sin token en cliente.

Decisión menor:

4. ~~**Rama de trabajo**~~ — resuelto: se formaliza `develop` (push ahí, merge a
   `main` vía PR cuando esté validado).

Ya resuelto por el prototipo: la UX de captura ofrece **scrub + timecode exacto +
salto por fotograma** (ambos), no hace falta elegir.
