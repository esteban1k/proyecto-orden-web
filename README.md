# proyecto-orden-web

Sitio público de **Lista Criolla** (GitHub Pages + `listacriolla.app`).

| Campo | Valor |
|---|---|
| Repo | `esteban1k/proyecto-orden-web` |
| Rama `main` (live) | Landing «qué hace», `/privacidad/` v1.7 y `/terminos/`. Pages publica la raíz, no `app/` |
| URL canónica | `https://listacriolla.app` |
| Privacy | `https://listacriolla.app/privacidad/` |
| Contacto | `hola@listacriolla.app` |
| Instagram | [@listacriolla](https://instagram.com/listacriolla) |
| CNAME | `listacriolla.app` |
| Package | `app.proyectoorden.listacriolla` |

## Contenido (`main`)

- **`/`** — Qué hace la app (listas, tareas, calma, local-first), quote del creador, galería con capturas recortadas en `assets/img/screens/site-*.png`.
- **`/privacidad/`** — Política v1.7 / app 1.0.0; avisos de resumen y vencimiento programados en el teléfono (no se envían a servidores nuestros).
- **`/terminos/`** — Términos de uso 1.0.0.
- **Crédito** — Sitio desarrollado por **Esteban Martín** → `https://emartin.com.ar` (footer inicio + privacidad).
- **CSP** — meta tag en `/`, `/privacidad/` y `/terminos/`: sin scripts ni recursos remotos. `frame-ancestors` no aplica en un meta tag; el header lo tiene que poner el host.

`app/` (Next, export estático) no entra en el deploy de Pages.

## Dominios (301)

| Dominio | Rol |
|---|---|
| `listacriolla.app` | Principal |
| `listacriolla.com` | **301** → `https://listacriolla.app` |
| `listacriolla.com.ar` | **301** → `https://listacriolla.app` cuando Cloudflare active |

## Vista local

```bash
python3 -m http.server 8080
```

## Calidad (CI / Police)

| Workflow | Cuándo | Qué hace |
|---|---|---|
| **CI** | `pull_request` | `static_check.py` (HTML UTF-8, títulos, CSP) y job `web-app` (Node 22) |
| **Police Preflight** | push a ramas ≠ `main` (PR abierto) | **web:** hygiene, secrets, `static_check.py`. **web-next** (si el push toca `app/`): `npm ci`, `build`, `lint` en `app/` → comentario en PR |
| **Police Docs** | push a ramas ≠ `main` (PR abierto) | perfiles `app`, `web`, `qa` en los commits del push → comentario en PR |

Perfiles alineados con [Police Kit `web-next`](https://github.com/esteban1k/proyecto-qa/tree/main/packages/police-kit/workflows/web-next). Sesión M1 y riesgo XSS: `app/README.md` (sección *Sesión, XSS y camino a producción*).

## GitHub Pages

1. Settings → Pages → Deploy from a branch  
2. Branch: `main` · folder: `/ (root)`  
3. Custom domain: `listacriolla.app` (debe coincidir con `CNAME`)  
4. Enforce HTTPS  

Archivos listos: `CNAME`, `.nojekyll`, canónicas, `sitemap.xml`, `robots.txt`.

## Relación con la app

Pages sirve este sitio estático. La app móvil es `esteban1k/proyecto-orden-mobile`. La app web de cuenta vive en `app/` y no se publica con el sitio de marketing.
