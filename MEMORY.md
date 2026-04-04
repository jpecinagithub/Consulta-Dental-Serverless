# MEMORY.md — Consulta Dental Serverless

Historial de decisiones técnicas y problemas resueltos durante el desarrollo.

## Decisiones de diseño

- **Email**: Resend con `onboarding@resend.dev` como FROM. No requiere dominio propio verificado. Variable de entorno: `RESEND_API_KEY`.
- **Base de datos**: Vercel KV via Upstash Redis (Vercel eliminó su KV nativo). Se conecta desde Vercel → Storage → Marketplace → Upstash.
- **Auth admin**: HMAC-SHA256 con cookie httpOnly de 8h. El middleware corre en Edge Runtime y usa Web Crypto API.
- **Slots**: 30 minutos, timezone `Europe/Madrid`. El horario por defecto es L-V 09:00-18:00 con pausa 14:00-15:00.
- **Cancelación**: Token UUID con TTL 30 días en Redis. El paciente recibe el link en el email de confirmación.

## Problemas resueltos

| Problema | Causa | Solución |
|---|---|---|
| `next.config.ts` no soportado | Next.js 14.2.3 solo acepta `.mjs` o `.js` | Renombrar a `next.config.mjs` |
| Middleware crash en Edge Runtime | `createHmac` de Node.js no disponible en Edge | Reescribir con `crypto.subtle` (Web Crypto API) |
| `smembers<string>` error TypeScript | `@vercel/kv` v2 cambió la firma genérica | Quitar el genérico y usar `as string[]` |
| Build crash en Vercel (KV) | `createClient({url:''})` lanza error en build time | Inicialización lazy: `getKv()` llamado dentro de cada función |
| Build crash en Vercel (Resend) | `new Resend(undefined)` lanza error en build time | Inicialización lazy: `getResend()` llamado dentro de cada función |
| API routes evaluadas en build time | Next.js intenta pre-renderizarlas | Añadir `export const dynamic = 'force-dynamic'` a todos los API routes |
| Git push SSH fallando | URL remota en formato SSH | `git remote set-url --push origin https://github.com/...` |

## Variables de entorno

Todas configuradas en Vercel → Settings → Environment Variables:

| Variable | Descripción |
|---|---|
| `KV_REST_API_URL` | Inyectada automáticamente por Upstash |
| `KV_REST_API_TOKEN` | Inyectada automáticamente por Upstash |
| `RESEND_API_KEY` | API key de resend.com |
| `ADMIN_PASSWORD` | Contraseña del panel admin |
| `ADMIN_SESSION_SECRET` | Secret para firmar tokens HMAC |
| `CRON_SECRET` | Bearer token para proteger `/api/notify/daily` |
| `NEXT_PUBLIC_APP_URL` | `https://consulta-dental-serverless.vercel.app` |

## Estado verificado (2026-04-04)

- Flujo completo de reserva de paciente ✅
- KV (Upstash) guarda y recupera citas ✅
- Panel admin con login funciona ✅
- Agenda del admin muestra citas ✅
- Email de confirmación via Resend configurado ✅
