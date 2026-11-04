# proyecto-orden-web

Sitio público de **Lista Criolla** (GitHub Pages + `listacriolla.app`).

| Campo | Valor |
|---|---|
| Repo | `esteban1k/proyecto-orden-web` |
| Rama `main` (live) | Landing **Próximamente** + política `/privacidad/` hasta merge del PR de sitio |
| Rama de trabajo | `site/que-hace` → [PR #2](https://github.com/esteban1k/proyecto-orden-web/pull/2): landing «qué hace», capturas walkthrough, crédito [Esteban Martín](https://emartin.com.ar), privacidad con avisos locales (versión app **1.0.0**) |
| URL canónica | `https://listacriolla.app` |
| Privacy | `https://listacriolla.app/privacidad/` |
| Contacto | `hola@listacriolla.app` |
| Instagram | [@listacriolla](https://instagram.com/listacriolla) |
| CNAME | `listacriolla.app` |
| Package | `app.proyectoorden.listacriolla` |

## Contenido (rama `site/que-hace`)

- **`/`** — Qué hace la app (listas, tareas, calma, local-first), quote del creador, galería con capturas reales en `assets/img/screens/`.
- **`/privacidad/`** — Política v1.7 / app 1.0.0; avisos de resumen y vencimiento programados en el teléfono (no se envían a servidores nuestros).
- **Crédito** — Sitio desarrollado por **Esteban Martín** → `https://emartin.com.ar` (footer inicio + privacidad).

Capturas actualizadas pendientes: se agregarán desde el store (`media/site-2026-11-04/`) en el mismo PR antes del merge.

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
| **CI** | `pull_request` | `static_check.py` (HTML UTF-8, títulos) |
| **Police Preflight** | push a ramas ≠ `main` (PR abierto) | hygiene, secret scan, static check → comentario en PR |
| **Police Docs** | push a ramas ≠ `main` (PR abierto) | docs vs cambios en `index.html` / `privacidad/` → comentario en PR |

Perfil **web** (sin Flutter): ver `tool/police/`. Espejo de reglas en el repo app `esteban1k/proyecto-orden`.

## GitHub Pages

1. Settings → Pages → Deploy from a branch  
2. Branch: `main` · folder: `/ (root)`  
3. Custom domain: `listacriolla.app` (debe coincidir con `CNAME`)  
4. Enforce HTTPS  

Archivos listos: `CNAME`, `.nojekyll`, canónicas, `sitemap.xml`, `robots.txt`.

## Relación con la app

Solo sitio estático. App: `esteban1k/proyecto-orden` (no se toca desde aquí).
