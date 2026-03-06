# 3iFit — PWA Wellness

App de bienestar corporativo con autenticación Google, pantallas de onboarding, home, perfil, misiones, comunidad y ranking.

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- Google Cloud Console (para OAuth)

## Configuración

### 1. Instalar dependencias

```bash
cd 3ifit-app && npm install
```

### 2. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En **Authentication → Providers**, activa Google OAuth y configura Client ID y Secret
3. En **Authentication → URL Configuration**, añade:
   - Site URL: `http://localhost:3000` (desarrollo) o tu dominio
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://tu-dominio.com/auth/callback`

### 3. Variables de entorno

Copia `.env.local.example` a `.env.local` y rellena al menos:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Para notificaciones push con cron, añade también `VAPID_*`, `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`. Ver sección **Despliegue en servidor de empresa**.

> **Importante:** Si faltan las variables de Supabase, la app lanzará un error claro al arrancar.

### 4. Base de datos

Ejecuta las migraciones en orden (Supabase SQL Editor o CLI):

```bash
# Con Supabase CLI (opcional)
supabase db push

# O manualmente: ejecuta cada archivo en supabase/migrations/ por orden numérico
# 001_initial_schema.sql, 002_seed_data.sql, 003_profile_plan_privacy.sql, ...
```

### 5. Iconos PWA (opcional)

```bash
npm run generate-icons
```

O añade manualmente `icon-192.png` e `icon-512.png` en `public/icons/`.

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La app redirige a login; inicia sesión con Google.

## Scripts

| Comando                  | Descripción            |
| ------------------------ | ---------------------- |
| `npm run dev`            | Servidor de desarrollo |
| `npm run build`          | Build de producción    |
| `npm run start`          | Servidor de producción |
| `npm run lint`           | Ejecutar ESLint        |
| `npm run generate-icons` | Generar iconos PWA     |

## Arquitectura

```
src/
├── app/                    # App Router (Next.js)
│   ├── (app)/              # Layout con NavBar
│   │   └── app/            # Rutas protegidas
│   │       ├── home/       # Inicio, plan semanal, ranking equipos
│   │       ├── ranking/    # Ranking empresa y equipos
│   │       ├── comunidad/  # Feed de actividades
│   │       ├── misiones/   # Misiones semanales
│   │       ├── perfil/     # Perfil, XP, racha
│   │       ├── configuracion/
│   │       ├── onboarding/
│   │       └── registrar-actividad/
│   ├── auth/               # Callback OAuth, signout
│   └── login/
├── components/
│   ├── ui/                 # Card, Avatar, EmptyState, AppLink
│   ├── layout/             # NavBar, PageHeader
│   └── home/                # DonutChart
├── contexts/               # AuthContext, XPContext, BreakReminderContext
├── lib/                    # Supabase client, env, plan, levels, rankColors
└── types/                  # database.ts (tipos centralizados)
```

### Flujo de autenticación

1. Usuario visita `/` o `/app/*` → proxy (`src/proxy.ts`) verifica sesión
2. Sin sesión → redirige a `/login`
3. Login con Google → `/auth/callback` → crea/actualiza perfil
4. Si `onboarding_completed_at` es null → redirige a `/app/onboarding`
5. Rutas `/app/*` protegidas por RLS en Supabase

### Datos principales

- **profiles**: usuario, plan (basico/estandar/pro), nivel, departamento
- **activities**: minutos por actividad, tipo, notas
- **feed_posts**: publicaciones en comunidad (compartir actividad)
- **leaderboard_entries**: minutos por temporada (ranking)
- **user_weekly_missions**: misiones semanales con progreso
- **xp_events**: eventos de XP (actividad, plan, misión, clap, etc.)

## Despliegue en Vercel

Para desplegar en Vercel con cron, Redis y notificaciones push, sigue la guía completa:

**[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** — Paso a paso desde cero

Incluye: Supabase, Upstash Redis, claves VAPID, CRON_SECRET, variables de entorno y troubleshooting.

## Despliegue en servidor de empresa

### 1. Build de producción

```bash
npm run build
npm run start
```

O usar PM2, Docker o el proceso manager de la empresa.

### 2. Variables de entorno en producción

Copia `.env.local.example` a `.env.local` y configura:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (ej: `https://3ifit.empresa.com`) |
| `VAPID_PUBLIC_KEY` | Clave pública VAPID (push) |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID (push) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Misma que `VAPID_PUBLIC_KEY` (para el cliente) |
| `CRON_SECRET` | Secreto para proteger el endpoint de cron |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role de Supabase (solo servidor) |
| `REDIS_URL` | (Opcional) Redis para rate limiting distribuido en multi-instancia |

> **Recordatorio:** Si desplegas en producción con varias instancias (PM2, Kubernetes, etc.), configura `REDIS_URL` para que el rate limiting funcione correctamente entre todas las instancias.

### 3. Supabase en producción

- **Authentication → URL Configuration**: Site URL = `NEXT_PUBLIC_APP_URL`, Redirect URLs = `{APP_URL}/auth/callback`
- Ejecutar migraciones: `supabase db push` o manualmente en el SQL Editor (incluye 033_performance_indexes)

### 4. Generar claves VAPID

```bash
npm run generate-vapid
```

Copia `publicKey` a `VAPID_PUBLIC_KEY` y `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, y `privateKey` a `VAPID_PRIVATE_KEY`.

### 5. Cron para notificaciones push

Configurar un cron en el servidor para llamar al endpoint de recordatorios. Ejemplo (cada día a las 14:00):

```bash
# Linux cron (crontab -e)
0 14 * * * curl -X POST -H "Authorization: Bearer TU_CRON_SECRET" https://3ifit.empresa.com/api/cron/send-reminders
```

O con Task Scheduler (Windows), o el sistema de tareas de la empresa.

El cron envía recordatorios de:
- **Plan semanal**: si faltan 1–3 días para completar el plan
- **Actividad diaria**: si no ha registrado actividad hoy (a partir de las 14:00)

### 6. Iconos PWA

Antes del primer build:

```bash
npm run generate-icons
```

Requiere `public/icons/tresipunt_logo_processed.png`.

## Contribución

1. Crea una rama desde `main`
2. Haz los cambios y verifica con `npm run build` y `npm run lint`
3. Abre un Pull Request con descripción clara
4. Mantén los tipos en `src/types/database.ts` sincronizados con el esquema

### Logging y rate limiting

- **Logger** (`src/lib/logger.ts`): Errores centralizados. Para Sentry, actualizar `logError` para llamar a `Sentry.captureException`.
- **Rate limiting** (`src/lib/rateLimit.ts`): Límites por usuario: upload (20/min), registerActivity (30/min), like (60/min). Sin `REDIS_URL` usa memoria (una instancia). Con `REDIS_URL` usa Redis para producción multi-instancia.

### Convenciones

- Componentes en `components/`, lógica en `lib/` o `actions`
- Server actions en `*/actions.ts` con `"use server"`
- Tipos compartidos en `src/types/database.ts`
- Variables CSS en `globals.css` (--color-primary, --shadow-\*, etc.)
