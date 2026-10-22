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

export const FALLBACK_VERSION = '1.2.0';

/** Responsable de los datos (aviso de privacidad) y medio de contacto. */
export const OWNER = 'Juan Carlos Orozco';
export const CONTACT_EMAIL = 'contacto@syncoraplayer.app';

/** Fecha de la versión vigente del aviso de privacidad y de los términos. */
export const LEGAL_UPDATED = '8 de octubre de 2026';

/**
 * Proyecto de Supabase de la app. La llave `anon` es pública por diseño (va
 * dentro del APK): solo deja leer lo que el RLS permite, que para un visitante
 * sin sesión son las playlists marcadas como públicas.
 */
export const SUPABASE = {
  url: 'https://njkfudsyfzdkdvwizdag.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qa2Z1ZHN5Znpka2R2d2l6ZGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDkzNDMsImV4cCI6MjEwMTAyNTM0M30.Vzgmlu0y12EPZ2LtqxsWoJUhwQDbbysB-zxcew5xEaI',
} as const;

/** Paquete de Android, para abrir la app desde un enlace (`intent://`). */
export const ANDROID_PACKAGE = 'com.syncora.syncora_player';

export const SITE = {
  name: 'Syncora Player',
  title: 'Syncora Player: tu música, sin anuncios y sin pagar',
  description:
    'Reproductor de música gratuito para Android y Windows. Escucha sin anuncios, descarga para oír sin conexión, crea playlists con IA y mira tus estadísticas cuando quieras.',
};
