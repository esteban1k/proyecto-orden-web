# Lista Criolla — app web (Next.js)

Milestone **M1**: auth contra `proyecto-orden-api` en localhost. Export estático en `out/` (no se publica en GitHub Pages).

## Requisitos

- Node 20+
- API en http://localhost:8080 (`docker compose up` en `proyecto-orden-api`)

## Configuración

```bash
cp .env.example .env
```

| Variable | Uso |
|----------|-----|
| `API_PROXY_TARGET` | Destino de `rewrites` en `npm run dev` |
| `NEXT_PUBLIC_API_BASE_URL` | Vacío en dev; URL absoluta de la API para build estático servido fuera de Next dev |
| `NEXT_PUBLIC_DEVICE_LABEL` | Etiqueta de dispositivo en register/login |

## Scripts

```bash
npm run dev    # http://localhost:3000 — proxy /v1/* → API
npm test
npm run build  # genera out/
```

## Rutas

- `/` → redirige a `/listas/`
- `/login/` — registro, login, Google (stub si OAuth sin configurar)
- `/verify-email/` — OTP 6 dígitos (entregado en log del server API en local)
- `/listas/` — stub protegido por sesión (M2 sync)

## CI

Job `web-app` en `.github/workflows/ci.yml` (no afecta deploy Pages del marketing).