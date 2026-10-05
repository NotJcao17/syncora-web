/**
 * Datos del sitio que cambian con cada versión o al desplegar.
 *
 * Las descargas apuntan a `releases/latest/download/<archivo>`: GitHub
 * redirige siempre al archivo de la última versión publicada, así que la web
 * no se toca al sacar una versión nueva mientras el nombre del archivo se
 * mantenga. La versión, el tamaño y la fecha se leen de la API de GitHub en el
 * navegador (ver `scripts/download.ts`); esto es solo el respaldo.
 */
export const REPO = 'NotJcao17/syncora-player';
export const REPO_URL = `https://github.com/${REPO}`;
export const RELEASES_URL = `${REPO_URL}/releases`;

export const DOWNLOADS = {
  android: {
    file: 'Syncora.apk',
    url: `${REPO_URL}/releases/latest/download/Syncora.apk`,
    requirement: 'Android 7.0 o más reciente',
  },
  windows: {
    file: 'SyncoraSetup.exe',
    url: `${REPO_URL}/releases/latest/download/SyncoraSetup.exe`,
    requirement: 'Windows 10 u 11 de 64 bits',
  },
} as const;

export const FALLBACK_VERSION = '1.0.0';

export const SITE = {
  name: 'Syncora',
  title: 'Syncora: tu música, sin anuncios y sin pagar',
  description:
    'Reproductor de música gratuito para Android y Windows. Escucha sin anuncios, descarga para oír sin conexión, crea playlists con IA y mira tus estadísticas cuando quieras.',
};
