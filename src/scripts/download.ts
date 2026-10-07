import { DOWNLOADS, REPO } from '../data/site';

type Platform = 'android' | 'windows' | 'other';

interface ReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

const CACHE_KEY = 'syncora-release';
const CACHE_MS = 30 * 60 * 1000;

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/Windows NT/i.test(ua) && !/Windows Phone/i.test(ua)) return 'windows';
  return 'other';
}

/** Desplazamiento suave que respeta Lenis si está activo. */
function scrollToTarget(target: HTMLElement) {
  const lenis = (window as unknown as { __lenis?: { scrollTo: (el: HTMLElement, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(target, { offset: -96 });
  else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function initDownloads() {
  const platform = detectPlatform();

  if (platform !== 'other') {
    const info = DOWNLOADS[platform];
    const panel = document.getElementById(`instalar-${platform}`);
    panel?.classList.add('is-mine');

    document.querySelectorAll<HTMLAnchorElement>('[data-download-auto]').forEach((btn) => {
      btn.href = info.url;
      btn.dataset.download = platform;
      const label = btn.querySelector('[data-download-label]');
      if (label) label.textContent = platform === 'android' ? 'Descargar para Android' : 'Descargar para Windows';
      // La descarga arranca por el enlace; después se muestran los pasos para
      // instalarla, que es justo donde la gente se atora.
      btn.addEventListener('click', () => {
        if (panel) window.setTimeout(() => scrollToTarget(panel), 350);
      });
    });
  }

  void loadRelease();
}

async function loadRelease() {
  let release: Release | null = null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { at, data } = JSON.parse(cached) as { at: number; data: Release };
      if (Date.now() - at < CACHE_MS) release = data;
    }
  } catch {
    /* sin almacenamiento: se pide a la API */
  }

  if (!release) {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) return; // todavía no hay versión publicada: se queda el respaldo
      release = (await res.json()) as Release;
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: release }));
      } catch {
        /* nada */
      }
    } catch {
      return;
    }
  }

  applyRelease(release);
}

function applyRelease(release: Release) {
  const version = release.tag_name.replace(/^v/i, '');
  document.querySelectorAll('[data-release-version]').forEach((el) => (el.textContent = version));

  const date = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(release.published_at),
  );

  (['android', 'windows'] as const).forEach((platform) => {
    const expected = DOWNLOADS[platform].file.toLowerCase();
    const ext = platform === 'android' ? '.apk' : '.exe';
    const asset =
      release.assets.find((a) => a.name.toLowerCase() === expected) ??
      release.assets.find((a) => a.name.toLowerCase().endsWith(ext));
    if (!asset) return;

    const size = `${Math.round(asset.size / (1024 * 1024))} MB`;
    const infoEl = document.querySelector(`[data-asset-info="${platform}"]`);
    if (infoEl) infoEl.textContent = `${asset.name} · ${size} · ${date}`;

    // Si el archivo no se llama como se espera, se usa su URL real.
    if (asset.name.toLowerCase() !== expected) {
      document
        .querySelectorAll<HTMLAnchorElement>(`[data-download="${platform}"]`)
        .forEach((a) => (a.href = asset.browser_download_url));
    }
  });
}
