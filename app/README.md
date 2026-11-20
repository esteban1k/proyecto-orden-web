# Lista Criolla — app web (Next.js)

Milestone **M1**: auth contra `proyecto-orden-api` en localhost. Export estático en `out/` (no se publica en GitHub Pages).

## Requisitos

- Node 22+ (ver `.nvmrc`)
- API en http://127.0.0.1:8080 (`docker compose up` en `proyecto-orden-api`)

## Configuración

```bash
cp .env.example .env
```

| Variable | Uso |
|----------|-----|
| `API_PROXY_TARGET` | Destino de `rewrites` solo en `npm run dev`. El build estático no proxifica. http solo loopback. |
| `NEXT_PUBLIC_API_BASE_URL` | Vacío en dev. Origen https de la API en un build estático, para fijar `connect-src`. |
| `NEXT_PUBLIC_DEVICE_LABEL` | Etiqueta de dispositivo en register/login |

## Scripts

```bash
npm run dev    # http://localhost:3000 — proxy /v1/* → API
npm test
npm run lint
npm run build  # genera out/
```

## Rutas

- `/` → redirige a `/listas/`
- `/login/` — registro, login, Google (mensaje fijo si OAuth no está)
- `/verify-email/` — OTP 6 dígitos (en local, el código sale en el log del API)
- `/listas/` — stub protegido por sesión (M2 sync)

## Sesión y CSP

El export estático no puede emitir cookies `HttpOnly`. La sesión (`lc_web_session`) vive en `localStorage`: cualquier XSS en el origen la lee. Mitigaciones de este milestone: no renderizar texto del API, validar el token antes de guardarlo, CSP por meta tag (`script-src 'self' 'unsafe-inline'` porque Next hidrata con scripts inline) y redirect de Google solo a `https://accounts.google.com/o/oauth2/`. `frame-ancestors` en un meta tag no lo aplica el browser; el host de `app.listacriolla.app` tiene que mandarlo por header.

## CI

Job `web-app` en `.github/workflows/ci.yml` (Node 22: `npm ci`, `npm audit`, test, lint, build). No afecta el deploy de Pages del marketing.
