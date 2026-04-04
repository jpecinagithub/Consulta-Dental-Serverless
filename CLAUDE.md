# CLAUDE.md — Consulta Dental Serverless

Sistema de reserva de citas para clínica dental. Next.js 14 + Vercel KV (Upstash Redis) + Resend.

## Stack

- **Framework**: Next.js 14.2.3 (App Router), TypeScript
- **Deploy**: Vercel (Hobby plan)
- **Base de datos**: Vercel KV via Upstash Redis (`@vercel/kv` con `createClient` lazy)
- **Email**: Resend con `onboarding@resend.dev` como FROM (sin dominio propio)
- **Auth admin**: HMAC-SHA256 con cookie `dental_admin` (8h TTL)
- **Middleware**: Edge Runtime — usar Web Crypto API, NO `crypto` de Node.js
- **Timezone**: `Europe/Madrid` via `date-fns-tz`
- **Cron**: `vercel.json` — `"0 6 * * *"` → llama a `/api/notify/daily` (07:00 Madrid)

## Arquitectura

```
app/
  page.tsx                        → Landing pública (BookingFlow)
  cancel/page.tsx                 → Cancelación por token
  admin/page.tsx                  → Panel admin (protegido por middleware)
  admin/login/page.tsx            → Login admin
  api/
    appointments/route.ts         → GET slots disponibles, POST crear cita
    appointments/cancel/route.ts  → GET info por token, POST cancelar
    schedules/[dentistId]/route.ts → GET/PUT horario del dentista
    blocks/[dentistId]/route.ts   → GET/POST/DELETE bloqueos de slots
    admin/appointments/route.ts   → GET/DELETE citas (admin)
    admin/login/route.ts          → POST login
    admin/logout/route.ts         → POST logout
    notify/daily/route.ts         → GET resumen diario (cron)
lib/
  kv.ts        → Capa de abstracción sobre Vercel KV (cliente lazy)
  email.ts     → Emails con Resend (cliente lazy)
  auth.ts      → HMAC tokens Node.js (solo API routes, no middleware)
  dentists.ts  → Config estática de los 3 dentistas
  slots.ts     → Generación de slots de 30 min con timezone Madrid
types/index.ts → Dentist, Schedule, Appointment, CreateAppointmentBody
```

## Reglas críticas

- **Todos los API routes deben tener `export const dynamic = 'force-dynamic'`** para evitar que Next.js los evalúe en build time (lo que rompe la inicialización de KV y Resend con vars vacías).
- **KV y Resend se inicializan de forma lazy** (dentro de funciones, no a nivel de módulo) por el mismo motivo.
- **El middleware usa Web Crypto API** (`crypto.subtle`), no `require('crypto')` de Node.js — el Edge Runtime no tiene acceso a módulos de Node.
- **`next.config.mjs`** (no `.ts` ni `.js`) — Next.js 14.2.3 solo soporta `.mjs` para ESM.
- **`smembers` sin genérico** — `@vercel/kv` v2 cambió la firma: usar `as string[]` en el cast.

## Dentistas

Configurados en `lib/dentists.ts` (estáticos):
- `d1` — Dr. García · Odontología General
- `d2` — Dra. López · Ortodoncia
- `d3` — Dr. Martínez · Implantología

Emails reales en env vars: `DENTIST_1_EMAIL`, `DENTIST_2_EMAIL`, `DENTIST_3_EMAIL`

## Redis — esquema de claves

```
schedule:{dentistId}           → Schedule JSON
blocks:{dentistId}:{date}      → Set de horas bloqueadas ("10:00", "10:30"…)
slot:{dentistId}:{date}:{time} → appointmentId (SETNX atómico)
appt:{id}                      → Appointment JSON
appts:{dentistId}:{date}       → Set de appointmentIds del día
cancel:{token}                 → appointmentId (TTL 30 días)
```

## Variables de entorno necesarias

| Variable | Descripción |
|---|---|
| `KV_REST_API_URL` | Upstash — inyectada por Vercel Storage |
| `KV_REST_API_TOKEN` | Upstash — inyectada por Vercel Storage |
| `RESEND_API_KEY` | API key de resend.com |
| `ADMIN_PASSWORD` | Contraseña del panel admin |
| `ADMIN_SESSION_SECRET` | Secret para firmar tokens HMAC |
| `CRON_SECRET` | Bearer token para proteger `/api/notify/daily` |
| `NEXT_PUBLIC_APP_URL` | URL pública del deploy (ej: `https://consulta-dental-serverless.vercel.app`) |
| `DENTIST_1_EMAIL` | Email real del Dr. García (opcional, fallback en código) |
| `DENTIST_2_EMAIL` | Email real de la Dra. López (opcional) |
| `DENTIST_3_EMAIL` | Email real del Dr. Martínez (opcional) |

## Comandos

```bash
npm run dev     # desarrollo local
npm run build   # verificar que compila antes de push
npm run lint
```

## URLs

- **Pacientes**: `https://consulta-dental-serverless.vercel.app/`
- **Admin**: `https://consulta-dental-serverless.vercel.app/admin`
- **Cancelación**: `https://consulta-dental-serverless.vercel.app/cancel?token=<uuid>`
