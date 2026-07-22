# SPEC — Módulo E: Reservas de alquiler

> Estado: **implementado** (código). Pendiente manual: `npm run db:migrate`
> para crear la tabla `Reservation` y el campo `stock`. Extiende el catálogo
> de alquiler (módulo C) con disponibilidad por fechas y reservas online.
> Nuevo módulo, presupuesto aparte del de la web.

## Implementación (22 jul 2026)

- Modelo: `RentalItem.stock` + modelo `Reservation` (status/kind, cliente,
  fechas, cantidad) en `schema.prisma`.
- Lógica pura de disponibilidad en `src/lib/rental-availability.ts` (solape con
  fin exclusivo, unidades libres vs stock) — con pruebas.
- Server Actions: `src/lib/rental-booking.ts` (`checkAvailability`,
  `createReservation` con transacción anti-sobreventa + emails Resend) y
  acciones admin en `rental/actions.ts` (`createBlock`, `cancelReservation`,
  `deleteReservation`, stock en crear/editar).
- Público: ficha `/[locale]/alquiler/[id]` + `BookingWidget` (fechas, cantidad,
  comprobar disponibilidad, formulario con honeypot). Tarjetas del grid
  enlazadas a la ficha.
- Panel: página `/admin/rental/reservations` (lista con filtros próximas/
  pasadas/canceladas, cancelar/borrar, crear bloqueo interno) + campo stock en
  el formulario de pieza + enlace en la navegación.
- Seed de demo actualizado con stock y reservas de ejemplo.

> Nota: en el sandbox no se pudo regenerar el cliente Prisma (sin red a los
> binarios). tsc muestra errores de `stock`/`reservation` que se resuelven al
> correr `npm run db:migrate` (o `prisma generate`) en local/Vercel. eslint y
> las pruebas de disponibilidad pasan.

## 1. Objetivo

Sistema profesional de reservas del vestuario de alquiler: cada pieza tiene
stock (varias unidades), los clientes consultan disponibilidad por fechas en
la web y solicitan una reserva; si hay unidades libres en ese rango, la
reserva se **confirma automáticamente**. Práxedes gestiona todo (reservas y
bloqueos internos) desde el panel.

## 2. Decisiones (validadas)

- **Reservas online**: el cliente elige fechas + cantidad y envía la solicitud.
- **Varias unidades**: cada pieza tiene `stock`; la disponibilidad se calcula
  como stock menos las unidades ya reservadas/bloqueadas que solapan el rango.
- **Confirmación automática**: si hay stock suficiente en las fechas, la
  reserva queda `CONFIRMED` al instante; si no, se rechaza con aviso. Práxedes
  puede cancelar cualquier reserva desde el panel.
- **Emails (Resend)**: al confirmarse, aviso a Práxedes y confirmación al
  cliente.

## 3. Modelo de datos

`RentalItem` (existente) + `stock Int @default(1)`.

Nuevo `Reservation`:

- `id`, `itemId` → RentalItem (cascade)
- `startDate`, `endDate` (DateTime, tratadas como días; `end` exclusivo)
- `quantity Int @default(1)`
- `status` enum `ReservationStatus { CONFIRMED, CANCELLED }`
- `kind` enum `ReservationKind { CUSTOMER, BLOCK }` — BLOCK = uso interno /
  mantenimiento (sin cliente)
- Cliente: `customerName?`, `customerEmail?`, `customerPhone?`, `notes?`
- `createdAt`, `updatedAt`
- Índices: `[itemId, startDate, endDate]`, `[status]`

## 4. Disponibilidad (regla de solapamiento)

Dos rangos [aStart, aEnd) y [bStart, bEnd) solapan si
`aStart < bEnd && bStart < aEnd` (fin exclusivo: devolver el mismo día que otro
empieza no cuenta como solape).

`unidadesLibres(item, start, end) = item.stock − Σ quantity` de las reservas
del item con `status = CONFIRMED` (CUSTOMER y BLOCK) que solapan el rango.
Disponible si `unidadesLibres ≥ cantidadPedida`.

Nota de concurrencia: la comprobación y la creación se hacen en una
transacción para evitar sobreventa en solicitudes simultáneas.

## 5. Flujo público

Ficha de pieza `/[locale]/alquiler/[id]`: galería, descripción, stock, y un
widget: selector de fechas (inicio/fin) + cantidad → comprueba disponibilidad
→ si hay, formulario (nombre, email, teléfono, notas) → crea la reserva
confirmada y muestra confirmación. Honeypot anti-bots, validación Zod.

## 6. Panel

- `stock` en el formulario de pieza.
- Página de reservas: lista (próximas / pasadas), filtro por pieza y estado,
  cancelar reserva, y crear **bloqueo interno** (pieza + fechas + cantidad).
- Disponibilidad visible por pieza (unidades libres hoy / próximas).

## 7. Fuera de alcance (por ahora)

- Pagos / fianzas (sería un módulo aparte con Stripe).
- Precios y facturación.
- Calendario visual completo tipo Gantt (se puede añadir después; de momento
  lista + estados).

## 8. Pendiente manual

- `npm run db:migrate` para crear la tabla `Reservation` y el campo `stock`.
- `RESEND_API_KEY` + dominio verificado (ya requerido por el contacto).
