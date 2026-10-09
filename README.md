# proyecto-orden-web

Sitio público de **Lista Criolla** (GitHub Pages + `listacriolla.app`).

| Campo | Valor |
|---|---|
| Repo | `esteban1k/proyecto-orden-web` |
| Rama publicada (`main`) | Landing **Próximamente** + política `/privacidad/` |
| Sitio completo | rama `sitio-completo` (lanzamiento posterior) |
| URL canónica | `https://listacriolla.app` |
| Privacy | `https://listacriolla.app/privacidad/` |
| Contacto | `hola@listacriolla.app` |
| Instagram | [@listacriolla](https://instagram.com/listacriolla) |
| CNAME | `listacriolla.app` |
| Package | `app.proyectoorden.listacriolla` |

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

## GitHub Pages (cuando el repo sea público)

1. Settings → Pages → Deploy from a branch  
2. Branch: `main` · folder: `/ (root)`  
3. Custom domain: `listacriolla.app` (debe coincidir con `CNAME`)  
4. Enforce HTTPS  

Archivos listos: `CNAME`, `.nojekyll`, canónicas, `sitemap.xml`, `robots.txt`.

## Relación con la app

Solo sitio estático. App: `esteban1k/proyecto-orden` (no se toca desde aquí).
