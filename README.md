# proyecto-orden-web

Sitio público de **Lista Criolla** (rama `sitio-completo`; `main` = Próximamente + privacidad) — HTML + CSS estático, pensado para GitHub Pages + dominio custom.

| Campo | Valor |
|---|---|
| Repo | [`esteban1k/proyecto-orden-web`](https://github.com/esteban1k/proyecto-orden-web) · **privado** |
| Branch | `main` (commits locales pueden ir adelante del remoto hasta push autorizado) |
| Stack | HTML + CSS (sin build obligatorio) |
| Marca | **Lista Criolla** |
| URL canónica | `https://listacriolla.app` |
| Privacy (candidata) | `https://listacriolla.app/privacidad/` — **aún no publicada** |
| Package | `app.proyectoorden.listacriolla` |
| Instagram | [@listacriolla](https://instagram.com/listacriolla) |
| Contacto | [`hola@listacriolla.app`](mailto:hola@listacriolla.app) |
| CNAME | `CNAME` → `listacriolla.app` (listo en repo) |

## Dominios y redirects (301)

| Dominio | Rol |
|---|---|
| `listacriolla.app` | **Principal** · canónica · target de `CNAME` |
| `listacriolla.com` | **301** → `https://listacriolla.app` (y paths equivalentes) |
| `listacriolla.com.ar` | **301** → `https://listacriolla.app` **cuando Cloudflare lo active** |

Configurar en el DNS/CDN (Cloudflare u otro): redirect permanente (HTTP 301) de `.com` y `.com.ar` hacia el apex `.app`. Mantener HTTPS en el destino.

## Contacto

| Canal | Estado |
|---|---|
| `hola@listacriolla.app` | Contacto privacidad / soporte / footer |
| Instagram | [@listacriolla](https://instagram.com/listacriolla) |

## Requisitos

- Git
- Un servidor HTTP estático (ver opciones abajo)
- Navegador moderno

No hace falta Node, npm, Flutter ni bundler. Abrir `index.html` con `file://` puede romper rutas relativas; usá siempre un servidor local.

## Clonar

```bash
git clone https://github.com/esteban1k/proyecto-orden-web.git
cd proyecto-orden-web
```

Repo privado: hace falta acceso GitHub (HTTPS con credencial/token, o SSH).

## Vista local

Serví la **raíz del repo** (donde está `index.html`). Luego abrí `http://localhost:8080/`.

### Linux / macOS

```bash
python3 -m http.server 8080
```

Opcional: `npx --yes serve -l 8080` · `php -S localhost:8080`

### Windows

```powershell
python -m http.server 8080
```

## Páginas

| Ruta URL | Archivo |
|---|---|
| `/` | `index.html` |
| `/privacidad/` | `privacidad/index.html` |
| `/terminos/` | `terminos/index.html` |
| `/soporte/` | `soporte/index.html` |
| `/borrar-cuenta/` | `borrar-cuenta/index.html` |
| `/novedades/` | `novedades/index.html` |
| `/sobre-mi/` | `sobre-mi/index.html` |

- CSS: `assets/css/site.css`
- SEO: meta/OG, canónicas `listacriolla.app`, `robots.txt`, `sitemap.xml`
- Custom domain: archivo `CNAME` con `listacriolla.app`

## GitHub Pages + dominio (pendiente)

### Ya en el repo

- Archivo **`CNAME`** con `listacriolla.app`.

### Aún NO (decisión Esteban)

- Repo permanece **privado**.
- **No** activar Pages live sin autorización (plan Free → 422 en privado).
- DNS: apex/www → GitHub Pages; **301** `.com` → `.app`; **301** `.com.ar` → `.app` cuando Cloudflare active.

Cuando el repo sea público (o haya Pro) y DNS apunte:

1. Settings → Pages → Deploy from branch `main` / `(root)`
2. Custom domain: `listacriolla.app` (debe coincidir con `CNAME`)
3. Enforce HTTPS

URL live esperada: `https://listacriolla.app/` · Privacy: `https://listacriolla.app/privacidad/`

## Relación con la app

Este repo es **solo** el sitio estático. La app Flutter vive en `esteban1k/proyecto-orden` y no se toca desde aquí.
