/**
 * Sitemap estático (sin @astrojs/sitemap para no sumar dependencias). Solo
 * las páginas que deben aparecer en buscadores: las vistas de playlists
 * compartidas llevan `noindex` y la de `/og` es solo la fuente de og.png.
 */
import type { APIRoute } from 'astro';

const PAGES = [
  { path: '/', priority: '1.0' },
  { path: '/privacidad/', priority: '0.3' },
  { path: '/terminos/', priority: '0.3' },
];

export const GET: APIRoute = ({ site }) => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map(
    ({ path, priority }) =>
      `  <url>\n    <loc>${new URL(path, site)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
