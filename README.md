# Syncora · web

Página promocional de [Syncora Player](https://github.com/NotJcao17/syncora-player).
Astro 7 (estático) + Tailwind 4 + GSAP/ScrollTrigger + Lenis. Pensada para Cloudflare Pages.

## Comandos

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/
npm run preview    # sirve dist/ para revisarlo
npm run check      # tipos (usa TypeScript 6: astro check no soporta la 7)
```

## Estructura

| Ruta | Qué es |
|---|---|
| `src/pages/index.astro` | La página: orden de las secciones |
| `src/components/` | Una sección por archivo, más `Phone` (marco Android), `Logo` y `DownloadButton` |
| `src/scripts/motion.ts` | Todo el movimiento: intro, hero, scroll de cada sección, mini reproductor |
| `src/scripts/download.ts` | Detecta Android/Windows y lee la última versión de GitHub |
| `src/data/site.ts` | Repo, nombres de archivo de descarga, requisitos, textos SEO |
| `src/data/logo.ts` | Logo vectorizado desde el ícono de la app (clave y anillos por separado) |
| `src/assets/screens/` | Capturas reales de la app (modo demo de Android) |
| `src/pages/og.astro` | Fuente de `public/og.png` (no se indexa) |
| `src/pages/privacidad.astro`, `terminos.astro` | Aviso de privacidad (LFPDPPP) y términos con el descargo de contenido. Fecha y contacto en `src/data/site.ts` |
| `src/pages/playlist.astro` + `src/scripts/shared-playlist.ts` | Vista de solo lectura de una playlist compartida desde la app |
| `public/_redirects` | Reescribe `/playlist/<id>` a la página de playlist (Cloudflare Pages) |
| `PRODUCT.md`, `DESIGN.md` | Para quién es la página y su sistema visual |

## Descargas

Los botones apuntan a `https://github.com/NotJcao17/syncora-player/releases/latest/download/<archivo>`:
GitHub siempre redirige al archivo de la última versión. Mientras los nombres sean
**`Syncora.apk`** y **`SyncoraSetup.exe`**, publicar una versión nueva no requiere tocar la web.
La versión, el tamaño y la fecha se leen en el navegador de la API de GitHub; si todavía no hay
ningún release, se muestra la versión de respaldo de `src/data/site.ts`.

## Cambiar capturas

1. Saca la captura (en el móvil, con el modo demo de Android).
2. Reemplaza el archivo en `src/assets/screens/` con el mismo nombre.
3. Las tarjetas del Wrapped se recortan de la pantalla completa: ver `wrapped-*.png`.

Astro genera AVIF y WebP en varios anchos al compilar.

## Imagen para redes

Con `npm run dev` encendido:

```bash
node scripts/og.mjs
```

## Revisión visual

`scripts/shoot.mjs` captura la página por secciones en escritorio y móvil con el Chrome
instalado (`playwright-core`, no descarga navegadores):

```bash
node scripts/shoot.mjs desktop capturas
node scripts/shoot.mjs mobile capturas
```

## Playlists compartidas

La app copia enlaces `https://syncoraplayer.app/playlist/<id>` y marca la playlist como pública.
La página pide la playlist a Supabase por REST con la llave `anon` (pública por diseño); el RLS solo
devuelve playlists con `is_public = true`, así que una privada o borrada se ve como "no disponible".
Reproducir, guardar o aleatorio abren un aviso con "Abrir en la app" (`intent://` en Android,
`syncoraplayer://` en Windows) y la descarga. Se cargan 100 canciones por página.

`npm run dev` no aplica `_redirects`: para probar en local usa `/playlist/?id=<uuid>`.

Todo lo que viene de la base lo escribió un usuario: se pinta con `textContent`, nunca como HTML.

## SEO

- `src/pages/sitemap.xml.ts`: sitemap estático con las páginas indexables (portada, privacidad,
  términos). Si se agrega una página pública, sumarla ahí.
- `public/robots.txt`: todo permitido salvo `/og`; apunta al sitemap.
- `src/pages/404.astro`: Cloudflare Pages lo sirve con estado 404. Sin él, cualquier ruta inexistente
  devolvía la portada con 200 ("soft 404").
- Íconos: `favicon.ico` (16/32/48), `favicon-96.png`, `favicon.svg`, `apple-touch-icon.png` e
  `icon-*.png` del `manifest.webmanifest`. Google usa el ícono del sitio en sus resultados (cuadrado,
  48 px o más). Se generan desde `favicon.svg`.
- Datos estructurados (JSON-LD) en `index.astro`: `WebSite` (nombre del sitio en Google),
  `Organization` (logo) y `SoftwareApplication`.
- Las vistas de playlists compartidas y `/og` llevan `noindex`.
- `public/_headers`: cabeceras de seguridad y caché larga para `/_astro/*`.

## Desplegar en Cloudflare Pages

1. Sube este repo a GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → conecta el repo.
3. Framework preset: **Astro**. Build command: `npm run build`. Output: `dist`.
4. Variable de entorno `NODE_VERSION` = `22` (o la que uses en local).
5. El dominio (`syncoraplayer.app`) ya está en `site` de `astro.config.mjs`.
6. Web Analytics se activa desde el proyecto de Pages (sin cookies, no requiere código).
