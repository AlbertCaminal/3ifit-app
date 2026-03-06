# Fix 404 en Vercel — Cambios realizados

## Qué se ha hecho

1. **App movida a la raíz:** Los archivos de `3ifit-app/` se han copiado a la raíz de `AppSalud/`. Ahora `package.json`, `src/`, `vercel.json` están en la raíz del proyecto.

2. **Cron con GET:** El endpoint `/api/cron/send-reminders` ahora acepta **GET** (Vercel Cron usa GET) además de POST.

## Qué debes hacer tú

### 1. Subir los cambios a GitHub

```bash
cd C:\Users\Albert\Desktop\AppSalud
git add .
git commit -m "Mover app a raíz para fix 404 en Vercel"
git push
```

### 2. Ajustar Root Directory en Vercel

1. Vercel → tu proyecto → **Settings** → **General**
2. Busca **Root Directory**
3. Si está en `3ifit-app`, **bórralo** o pon `.` (vacío)
4. Guarda

### 3. Redeploy

1. **Deployments** → menú (⋯) del último deploy → **Redeploy**
2. Espera a que termine

### 4. Comprobar

- La app debería cargar en `https://3ifitapp.vercel.app` (o tu URL)
- **Settings** → **Cron Jobs** → debería aparecer `send-reminders`
