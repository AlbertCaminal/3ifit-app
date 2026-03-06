# Guía de despliegue en Vercel — 3iFit

Esta guía te lleva paso a paso desde cero hasta tener la app desplegada en Vercel con cron, Redis y notificaciones push funcionando.

**Tiempo estimado:** 30–45 minutos (si ya tienes Supabase y Google OAuth configurados).

---

## Resumen de lo que vas a configurar

| Servicio | Para qué sirve |
|----------|----------------|
| **Vercel** | Hosting de la app Next.js |
| **Supabase** | Base de datos, auth Google, storage de imágenes |
| **Upstash Redis** | Rate limiting (obligatorio en Vercel por ser serverless) |
| **Vercel Cron** | Recordatorios push diarios (plan semanal, actividad) |

---

## Paso 1: Cuentas necesarias

Asegúrate de tener (o créalas):

- [ ] **Vercel** — [vercel.com](https://vercel.com) (conectar con GitHub)
- [ ] **Supabase** — [supabase.com](https://supabase.com)
- [ ] **Google Cloud Console** — para OAuth (si no lo tienes)
- [ ] **Upstash** — [upstash.com](https://upstash.com) (Redis gratuito)

---

## Paso 2: Subir el proyecto a GitHub

1. Crea un repositorio en GitHub (ej: `3ifit-app`).
2. En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/3ifit-app.git
git push -u origin main
```

---

## Paso 3: Configurar Supabase

### 3.1 Crear proyecto

1. Entra en [Supabase Dashboard](https://supabase.com/dashboard).
2. **New Project** → nombre, contraseña de DB, región.
3. Espera a que termine de crearse.

### 3.2 Ejecutar migraciones

1. Ve a **SQL Editor**.
2. Ejecuta cada archivo de `supabase/migrations/` **en orden numérico**:
   - `001_initial_schema.sql`
   - `002_seed_data.sql`
   - `003_profile_plan_privacy.sql`
   - … hasta `033_performance_indexes.sql`

O con CLI:

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

### 3.3 Activar Google OAuth

1. **Authentication** → **Providers** → **Google** → Enable.
2. En [Google Cloud Console](https://console.cloud.google.com):
   - Crea un proyecto (o usa uno existente).
   - **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
   - Tipo: **Web application**.
   - Authorized redirect URIs: `https://TU_PROJECT.supabase.co/auth/v1/callback`.
3. Copia **Client ID** y **Client Secret** a Supabase.

### 3.4 Anotar credenciales

En **Settings** → **API** anota:

- `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → será `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, no exponer)

---

## Paso 4: Crear base de datos Redis en Upstash

1. Entra en [Upstash Console](https://console.upstash.com).
2. **Create Database**:
   - Name: `3ifit-ratelimit`
   - Type: **Regional** (o Global si tienes usuarios en varias zonas)
   - Region: la más cercana (ej: `eu-west-1`).
3. En la base creada, ve a la pestaña **Connect** o **Node**.
4. Copia la **Connection string** con formato:
   ```
   rediss://:TU_PASSWORD@TU_ENDPOINT:6379
   ```
   (usa `rediss://` con doble 's' — TLS obligatorio en Upstash).
5. Esa URL es tu `REDIS_URL`. Guárdala para el Paso 8.

---

## Paso 5: Generar claves VAPID (push)

En tu máquina local:

```bash
cd 3ifit-app
npm run generate-vapid
```

Copia:
- `publicKey` → `VAPID_PUBLIC_KEY` y `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `privateKey` → `VAPID_PRIVATE_KEY`

---

## Paso 6: Generar CRON_SECRET

```bash
# En PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# O en Git Bash / Linux / Mac
openssl rand -hex 32
```

Guarda el resultado. Debe tener al menos 16 caracteres (Vercel lo exige).

---

## Paso 7: Importar en Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión.
2. **Add New** → **Project**.
3. Importa el proyecto desde GitHub (elige el repo).
4. **Project Name:** Elige un nombre (ej: `3ifit-app`). Tu URL será `https://3ifit-app.vercel.app`.
5. **Framework Preset:** Next.js (debería detectarse).
6. **Root Directory:** `./` (o la carpeta si el código no está en la raíz).
7. **Build Command:** `npm run build` (por defecto).
8. No hagas deploy todavía — primero configura las variables en el siguiente paso.

---

## Paso 8: Variables de entorno en Vercel

En el proyecto **Settings** → **Environment Variables**, añade:

| Nombre | Valor | Entornos |
|--------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://TU_PROYECTO.vercel.app` (el nombre del Paso 7) | Production, Preview |
| `VAPID_PUBLIC_KEY` | Del `generate-vapid` | Production, Preview |
| `VAPID_PRIVATE_KEY` | Del `generate-vapid` | Production, Preview |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Mismo que `VAPID_PUBLIC_KEY` | Production, Preview |
| `CRON_SECRET` | El generado en Paso 6 | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role de Supabase | Production, Preview |
| `REDIS_URL` | URL de Upstash (o tu Redis) | Production, Preview |

**Importante:** `NEXT_PUBLIC_APP_URL` será algo como `https://3ifit-app.vercel.app` (el nombre depende de tu proyecto en Vercel). Si no conoces la URL aún, haz el deploy primero y Vercel te la mostrará; luego actualiza esta variable y vuelve a desplegar.

---

## Paso 9: Configurar Supabase para la URL de Vercel

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:** `https://tu-proyecto.vercel.app`
3. **Redirect URLs:** añade `https://tu-proyecto.vercel.app/auth/callback`

---

## Paso 10: Primer deploy

1. En Vercel, **Deploy** (o haz push a `main` si ya conectaste el repo).
2. Espera a que termine el build.
3. Abre la URL: `https://tu-proyecto.vercel.app`
4. Prueba:
   - Login con Google
   - Registrar actividad
   - Subir foto
   - Dar like en comunidad

---

## Paso 11: Verificar el cron

1. Vercel → **Settings** → **Cron Jobs**.
2. Deberías ver `send-reminders` con schedule `0 13 * * *` (13:00 UTC = 14:00 España).
3. Para probar sin esperar:
   - En **Deployments** → el último deploy → **Functions**.
   - O llama manualmente: `curl -X POST -H "Authorization: Bearer TU_CRON_SECRET" https://tu-proyecto.vercel.app/api/cron/send-reminders`

---

## Paso 12: Redis — verificación

- **Con `REDIS_URL`:** La app usa Redis para rate limiting. En Vercel serverless es obligatorio para que funcione bien.
- **Sin `REDIS_URL`:** La app usa memoria en cada instancia. En Vercel, cada petición puede ir a una instancia distinta, así que el límite no es fiable. Configura Redis para producción.

**Alternativas a Upstash:**
- [Redis Cloud](https://redis.com/try-free/) — plan gratuito
- [Railway](https://railway.app) — Redis como add-on
- Cualquier Redis con URL `redis://` o `rediss://`

---

## Paso 13: Iconos PWA

Antes del primer deploy (o en local):

```bash
npm run generate-icons
```

Necesitas `public/icons/tresipunt_logo_processed.png`. Si no existe, crea iconos manualmente (192x192 y 512x512) en `public/icons/`.

---

## Cambiar horario del cron

El cron está en `vercel.json`:

```json
"schedule": "0 13 * * *"
```

Formato: `minuto hora día-mes mes día-semana` (UTC).

| Quieres | España (invierno) | UTC | Schedule |
|---------|-------------------|-----|----------|
| 14:00 | 14:00 | 13:00 | `0 13 * * *` |
| 15:00 | 15:00 | 14:00 | `0 14 * * *` |
| 12:00 | 12:00 | 11:00 | `0 11 * * *` |

---

## Troubleshooting

### Login no redirige bien
- Revisa URL en Supabase: Site URL y Redirect URLs.
- Deploy de nuevo tras cambiar variables.

### Cron no se ejecuta
- `CRON_SECRET` debe estar en Production.
- El cron solo corre en Production, no en Preview.
- Revisa **Settings → Cron Jobs** en Vercel.

### Rate limit no funciona
- Configura `REDIS_URL`.
- Si usas Upstash REST, puede que necesites adaptar el código a `@upstash/redis`.

### Imágenes no cargan
- Las imágenes van directo a Supabase; no pasan por Vercel.
- Comprueba políticas de Storage en Supabase.
- Revisa que el bucket `feed-images` sea público para lectura.

---

## Checklist final

- [ ] App desplegada y accesible
- [ ] Login con Google funciona
- [ ] Registrar actividad funciona
- [ ] Subir foto funciona
- [ ] Cron configurado en Vercel
- [ ] `REDIS_URL` configurado (recomendado)
- [ ] Supabase URL Configuration actualizada
- [ ] Iconos PWA generados
