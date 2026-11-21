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
- `/listas/` — sync real + wizard primer upload (M2)
- `/resumenes/` — totales y prefs de avisos (lectura del export)
- `/ajustes/` — sesiones, MCP tokens, wipe sync

## Sesión, XSS y camino a producción

### M1 — token en `localStorage` (deliberado)

`writeSession()` guarda el JSON de sesión bajo la clave `lc_web_session` en **`localStorage`**. En un export estático no hay servidor que pueda fijar cookies **`HttpOnly`** en el login; el browser tiene que conservar el `session_token` del lado cliente.

**Superficie XSS:** un script inyectado en el mismo origen (p. ej. fallo de sanitización, dependencia comprometida, `unsafe-inline` en CSP) puede llamar `localStorage.getItem('lc_web_session')` y exfiltrar el token. Eso equivale a robo de sesión hasta el `expires_at` del API.

**Mitigaciones en M1 (no sustituyen HttpOnly):**

- Validación estricta antes de persistir (`parseSession`, token ASCII imprimible, caducidad).
- No renderizar HTML crudo de la API en React.
- CSP por meta tag en el layout (`src/lib/csp.ts`); `connect-src` acotado al API.
- OAuth: navegación solo a `https://accounts.google.com/o/oauth2/` (`urlSafety.ts`).

**Antes de tratar auth como “producción lista”** hay que cerrar la brecha de almacenamiento del token (ver abajo).

### Camino planificado — cookies `HttpOnly` (post–M1)

Cuando la app deje de ser solo `output: 'export'` y corra detrás de un origen con servidor (Next en modo servidor, o reverse proxy):

1. Tras login/register/verify, el **API o BFF** responde con `Set-Cookie`: `session=…; HttpOnly; Secure; SameSite=Lax` (o `Strict` si el flujo lo permite).
2. El cliente **deja de** guardar `session_token` en `localStorage`; las llamadas autenticadas usan cookie (`credentials: 'include'`) o el BFF adjunta la cookie al upstream.
3. Eliminar/migrar `lc_web_session` al arrancar la nueva versión para no dejar tokens huérfanos en disco.
4. Endurecer CSP: quitar `'unsafe-inline'` donde Next lo permita (nonces o build sin inline), y fijar `frame-ancestors` por **header** en el host (`app.listacriolla.app`).

Hasta ese cambio, M1 es aceptable para desarrollo y demos con API local, no para datos sensibles en producción abierta.

### CSP (marketing vs app)

`frame-ancestors` en un **meta tag** no lo aplica el browser; el host del deploy tiene que enviarlo por header. En Pages del marketing raíz la CSP es scriptless; en `app/` Next requiere scripts inline para hidratar.

## CI

Job `web-app` en `.github/workflows/ci.yml` (Node 22: `npm ci`, `npm audit`, test, lint, build). No afecta el deploy de Pages del marketing.
