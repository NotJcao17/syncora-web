/**
 * Descargas totales de la app (todas las versiones), en el formato de los
 * badges "endpoint" de shields.io:
 *   https://img.shields.io/endpoint?url=https://syncoraplayer.app/api/downloads
 *
 * Suma solo `Syncora.apk` y `SyncoraSetup.exe` de los releases que no son
 * pre-release: el canal del motor de extracción (`engine-channel`) también
 * vive en GitHub Releases y sus descargas las hace la propia app, no la gente.
 *
 * Variable de entorno opcional `GITHUB_TOKEN` (token fine-grained de solo
 * lectura de repos públicos): sin ella se usa la API anónima, limitada a 60
 * peticiones por hora y compartida con todo lo que salga de la misma IP de
 * Cloudflare. El resultado se guarda 1 h en la caché de Cloudflare.
 */
const REPO = 'NotJcao17/syncora-player';
const ASSETS = new Set(['Syncora.apk', 'SyncoraSetup.exe']);
const CACHE_SECONDS = 3600;

export async function countDownloads(fetchImpl, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'syncoraplayer.app',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let total = 0;
  for (let page = 1; page <= 10; page++) {
    const res = await fetchImpl(`https://api.github.com/repos/${REPO}/releases?per_page=100&page=${page}`, { headers });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const releases = await res.json();
    for (const release of releases) {
      if (release.prerelease || release.draft) continue;
      for (const asset of release.assets ?? []) {
        if (ASSETS.has(asset.name)) total += asset.download_count ?? 0;
      }
    }
    if (releases.length < 100) break;
  }
  return total;
}

function badge(message, color = '6366F1') {
  return new Response(JSON.stringify({ schemaVersion: 1, label: 'downloads', message, color, cacheSeconds: CACHE_SECONDS }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestGet({ request, env, waitUntil }) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(new URL('/api/downloads', request.url).toString());
  // Último número bueno, para no mostrar "n/a" si GitHub falla (el límite
  // anónimo es por IP y las de salida de Cloudflare se comparten).
  const lastGoodKey = new Request(new URL('/api/downloads/last-good', request.url).toString());

  const cached = cache ? await cache.match(key) : null;
  if (cached) return cached;

  try {
    const total = await countDownloads(fetch, env.GITHUB_TOKEN);
    const message = new Intl.NumberFormat('en-US').format(total);
    const response = badge(message);
    if (cache) {
      waitUntil(cache.put(key, response.clone()));
      waitUntil(
        cache.put(
          lastGoodKey,
          new Response(message, { headers: { 'Cache-Control': 'public, max-age=2592000' } }),
        ),
      );
    }
    return response;
  } catch {
    // No se guarda en la caché de una hora: el siguiente intento vuelve a
    // preguntar a GitHub. Mientras, el último número conocido.
    const lastGood = cache ? await cache.match(lastGoodKey) : null;
    return lastGood ? badge(await lastGood.text()) : badge('n/a', 'lightgrey');
  }
}
