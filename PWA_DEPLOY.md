# PWA — Preparación y despliegue

Guía para configurar y desplegar 3iFit como Progressive Web App.

---

## Requisitos previos

- [ ] Servidor HTTPS (obligatorio para PWA)
- [ ] Iconos 192x192 y 512x512 en `public/icons/`
- [ ] `NEXT_PUBLIC_APP_URL` configurada con la URL de producción

---

## 1. Iconos PWA

### Opción A: Generar desde logo

```bash
# Coloca tu logo en public/icons/ (tresipunt_logo_processed.png, logo.png o icon.png)
npm run generate-icons
```

### Opción B: Crear manualmente

Crea estos archivos en `public/icons/`:

| Archivo | Tamaño | Uso |
|---------|--------|-----|
| `icon-192.png` | 192×192 px | Android, home screen |
| `icon-512.png` | 512×512 px | Splash, maskable, alta res |

**Recomendaciones:**
- Iconos cuadrados para `maskable`
- Fondo transparente o con padding para que no se recorte en Android
- [Maskable.app](https://maskable.app/) para previsualizar

---

## 2. Manifest

El archivo `public/manifest.json` incluye:

- `id`, `scope` para identificación única
- `shortcuts` para acceso rápido (Registrar, Inicio, Comunidad)
- Iconos `any` y `maskable`
- `display_override` para standalone

---

## 3. Service Worker

- **@ducanh2912/next-pwa** genera el SW automáticamente en build
- **sw-push.js** maneja notificaciones push
- En desarrollo: PWA deshabilitada (`disable: process.env.NODE_ENV === "development"`)

---

## 4. Verificación

### Chrome DevTools

1. Abre la app en Chrome
2. F12 → Application → Manifest
3. Comprueba que no haya errores y que los iconos carguen

### Lighthouse

1. F12 → Lighthouse
2. Pestaña "Progressive Web App"
3. Ejecuta auditoría

### Checklist

- [ ] Manifest válido y sin errores
- [ ] Iconos 192 y 512 cargando
- [ ] Service Worker registrado
- [ ] HTTPS activo
- [ ] `start_url` responde 200

---

## 5. Instalación

### Android

- Chrome: menú → "Añadir a pantalla de inicio"
- O banner: "Instalar aplicación"

### iOS (Safari)

- Compartir → "Añadir a pantalla de inicio"
- Requiere `apple-touch-icon` (ya configurado con icon-192)

### Desktop (Chrome/Edge)

- Icono de instalación en la barra de direcciones
- O menú → "Instalar 3iFit"

---

## 6. Variables de entorno

Para notificaciones push y cron:

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

Generar clave VAPID:

```bash
npm run generate-vapid
```

---

## 7. Problemas comunes

### "No se puede instalar"

- Verifica HTTPS
- Comprueba que el manifest esté en `/manifest.json`
- Revisa que los iconos existan y sean accesibles

### Service Worker no se actualiza

- En DevTools → Application → Service Workers → "Update"
- O borra caché y recarga

### Notificaciones no funcionan

- Usuario debe permitir notificaciones
- `weekly_plan_unlocked` debe ser true para recibir push
- Comprueba `VAPID_*` en Vercel
