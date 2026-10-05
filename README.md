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

## Desplegar en Cloudflare Pages

1. Sube este repo a GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → conecta el repo.
3. Framework preset: **Astro**. Build command: `npm run build`. Output: `dist`.
4. Variable de entorno `NODE_VERSION` = `22` (o la que uses en local).
5. Cuando tengas el dominio, cámbialo en `site` de `astro.config.mjs`.
