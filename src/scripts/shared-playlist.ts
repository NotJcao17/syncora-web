/**
 * Vista de una playlist compartida (`pages/playlist.astro`).
 *
 * Lee la playlist y sus canciones de Supabase por REST con la llave pública:
 * el RLS solo devuelve playlists con `is_public = true`, así que una privada o
 * borrada llega vacía y se muestra como "no disponible". Todo lo que viene de
 * la base lo escribió un usuario: se pinta siempre con `textContent`, nunca
 * como HTML.
 */
import { ANDROID_PACKAGE, DOWNLOADS, SUPABASE } from '../data/site';
import { detectPlatform } from './download';

const PAGE_SIZE = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mismos degradados que `PlaylistCoverWidget.presetGradients` de la app. */
const PRESET_GRADIENTS = [
  ['#6366F1', '#9333EA'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#06B6D4'],
  ['#EC4899', '#8B5CF6'],
  ['#3B82F6', '#1E40AF'],
  ['#D97706', '#B45309'],
  ['#14B8A6', '#0F766E'],
  ['#8B5CF6', '#4C1D95'],
];

interface PlaylistRow {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_liked: boolean | null;
}

interface TrackRow {
  album_id: number | null;
  title: string;
  artist_name: string;
  album_name: string | null;
  cover_url: string | null;
  duration_ms: number | null;
}

class NotFound extends Error {}

function playlistIdFromLocation(): string | null {
  // `/playlist/<id>` en producción (ver public/_redirects); `?id=` sirve para
  // probar con `npm run dev`, que no aplica las reescrituras.
  const fromPath = location.pathname.split('/').filter(Boolean)[1];
  const id = fromPath ?? new URLSearchParams(location.search).get('id');
  return id && UUID_RE.test(id) ? id.toLowerCase() : null;
}

async function rest(path: string, extraHeaders: Record<string, string> = {}): Promise<Response> {
  const res = await fetch(`${SUPABASE.url}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${SUPABASE.anonKey}`,
      ...extraHeaders,
    },
  });
  if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function fetchPlaylist(id: string): Promise<PlaylistRow> {
  const res = await rest(
    `playlists?id=eq.${id}&is_public=eq.true&select=id,title,description,cover_url,is_liked`,
  );
  const rows = (await res.json()) as PlaylistRow[];
  if (rows.length === 0) throw new NotFound();
  return rows[0];
}

async function fetchTracks(id: string, offset: number): Promise<{ rows: TrackRow[]; total: number | null }> {
  const res = await rest(
    `playlist_tracks?playlist_id=eq.${id}` +
      `&select=album_id,title,artist_name,album_name,cover_url,duration_ms` +
      `&order=order_index.asc,added_at.asc&limit=${PAGE_SIZE}&offset=${offset}`,
    { Prefer: 'count=exact' },
  );
  // Content-Range: "0-99/1234"
  const total = Number(res.headers.get('content-range')?.split('/')[1]);
  return { rows: (await res.json()) as TrackRow[], total: Number.isFinite(total) ? total : null };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function img(src: string, alt = ''): HTMLImageElement {
  const node = document.createElement('img');
  node.src = src;
  node.alt = alt;
  node.loading = 'lazy';
  node.decoding = 'async';
  node.referrerPolicy = 'no-referrer';
  return node;
}

const NOTE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';

function noteIcon(): HTMLElement {
  const wrap = el('span', 'pl__note');
  wrap.innerHTML = NOTE_SVG; // constante, no viene de la base
  return wrap;
}

/** La portada como la pinta la app: propia, degradado, color o 2x2 de álbumes. */
function renderCover(container: HTMLElement, playlist: PlaylistRow, tracks: TrackRow[]) {
  container.replaceChildren();
  container.style.background = '';
  const cover = playlist.cover_url ?? '';

  if (playlist.is_liked) {
    container.style.background = 'linear-gradient(135deg, #6366F1, #9333EA)';
    return;
  }
  if (cover.startsWith('gradient:')) {
    const index = Number.parseInt(cover.slice('gradient:'.length), 10) || 0;
    const [from, to] = PRESET_GRADIENTS[Math.abs(index) % PRESET_GRADIENTS.length];
    container.style.background = `linear-gradient(135deg, ${from}, ${to})`;
    return;
  }
  if (cover.startsWith('color:')) {
    const hex = cover.slice('color:'.length).replace('#', '');
    const rgb = hex.length === 8 ? hex.slice(2) : hex;
    if (/^[0-9a-f]{6}$/i.test(rgb)) container.style.background = `#${rgb}`;
    return;
  }
  if (/^https:\/\//i.test(cover)) {
    container.append(img(cover));
    return;
  }

  const seen = new Set<string>();
  const covers: string[] = [];
  for (const t of tracks) {
    if (!t.cover_url || !/^https:\/\//i.test(t.cover_url)) continue;
    const key = t.album_id != null ? String(t.album_id) : t.cover_url;
    if (seen.has(key)) continue;
    seen.add(key);
    covers.push(t.cover_url);
    if (covers.length === 4) break;
  }
  if (covers.length === 4) {
    const grid = el('div', 'pl__grid');
    covers.forEach((c) => grid.append(img(c)));
    container.append(grid);
  } else if (covers.length > 0) {
    container.append(img(covers[0]));
  } else {
    container.append(noteIcon());
  }
}

function formatDuration(ms: number | null): string {
  if (!ms || ms <= 0) return '';
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function formatTotal(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function trackRow(track: TrackRow, onClick: () => void): HTMLLIElement {
  const li = el('li');
  const btn = el('button', 'pl__row');
  btn.type = 'button';
  btn.setAttribute('aria-label', `Reproducir ${track.title} de ${track.artist_name}`);

  const thumb = el('span', 'pl__thumb');
  if (track.cover_url && /^https:\/\//i.test(track.cover_url)) thumb.append(img(track.cover_url));

  const text = el('span', 'pl__text');
  text.append(el('span', 'pl__name', track.title), el('span', 'pl__sub', track.artist_name));

  btn.append(thumb, text, el('span', 'pl__album', track.album_name ?? ''), el('span', 'pl__dur', formatDuration(track.duration_ms)));
  btn.addEventListener('click', onClick);
  li.append(btn);
  return li;
}

function setupGate(playlistId: string | null) {
  const dialog = document.querySelector<HTMLDialogElement>('[data-gate-dialog]');
  if (!dialog) return () => {};

  const platform = detectPlatform();
  const openApp = dialog.querySelector<HTMLAnchorElement>('[data-open-app]');
  const download = dialog.querySelector<HTMLAnchorElement>('[data-gate-download]');

  if (playlistId && openApp && platform !== 'other') {
    const fallback = `${location.origin}/#descargar`;
    openApp.href =
      platform === 'android'
        ? `intent://playlist/${playlistId}#Intent;scheme=syncoraplayer;package=${ANDROID_PACKAGE};` +
          `S.browser_fallback_url=${encodeURIComponent(fallback)};end`
        : `syncoraplayer://playlist/${playlistId}`;
    openApp.hidden = false;
  }
  if (download && platform !== 'other') {
    download.href = DOWNLOADS[platform].url;
    download.textContent = platform === 'android' ? 'Descargar para Android' : 'Descargar para Windows';
  }

  // Cerrar al tocar fuera del cuadro.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  return () => {
    if (!dialog.open) dialog.showModal();
  };
}

export function initSharedPlaylist() {
  const found = document.querySelector<HTMLElement>('[data-pl]');
  if (!found) return;
  const root: HTMLElement = found;

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const cover = $('[data-pl-cover]');
  const title = $('[data-pl-title]');
  const desc = $('[data-pl-desc]');
  const stats = $('[data-pl-stats]');
  const list = $('[data-pl-tracks]');
  const more = $('[data-pl-more]');
  const moreBtn = $<HTMLButtonElement>('[data-pl-more-btn]');
  const missing = $('[data-pl-missing]');
  const failed = $('[data-pl-error]');

  const id = playlistIdFromLocation();
  const openGate = setupGate(id);
  root.querySelectorAll('[data-gate]').forEach((b) => b.addEventListener('click', openGate));

  let playlist: PlaylistRow | null = null;
  let loaded: TrackRow[] = [];
  let total: number | null = null;

  function setState(state: 'loading' | 'ready' | 'missing' | 'error') {
    root.dataset.state = state;
    missing.hidden = state !== 'missing';
    failed.hidden = state !== 'error';
  }

  function renderStats() {
    const count = total ?? loaded.length;
    const parts = [`${count} ${count === 1 ? 'canción' : 'canciones'}`];
    // La duración total solo es exacta con todas las canciones cargadas.
    if (count > 0 && loaded.length >= count) {
      parts.push(formatTotal(loaded.reduce((sum, t) => sum + (t.duration_ms ?? 0), 0)));
    }
    stats.textContent = parts.join(' · ');
  }

  function appendTracks(rows: TrackRow[]) {
    list.append(...rows.map((t) => trackRow(t, openGate)));
    more.hidden = total == null || loaded.length >= total;
  }

  async function load() {
    if (!id) {
      setState('missing');
      return;
    }
    setState('loading');
    try {
      const [pl, first] = await Promise.all([fetchPlaylist(id), fetchTracks(id, 0)]);
      playlist = pl;
      loaded = first.rows;
      total = first.total;

      document.title = `${pl.title} · Syncora Player`;
      title.textContent = pl.title;
      if (pl.description?.trim()) {
        desc.textContent = pl.description;
        desc.hidden = false;
      }
      renderCover(cover, pl, loaded);
      renderStats();
      list.replaceChildren();
      if (loaded.length === 0) {
        list.append(el('li', 'pl__sub', 'Esta playlist todavía no tiene canciones.'));
      }
      appendTracks(loaded);
      setState('ready');
    } catch (error) {
      setState(error instanceof NotFound ? 'missing' : 'error');
    }
  }

  moreBtn.addEventListener('click', async () => {
    if (!id || !playlist) return;
    moreBtn.disabled = true;
    try {
      const next = await fetchTracks(id, loaded.length);
      loaded = loaded.concat(next.rows);
      total = next.total ?? total;
      appendTracks(next.rows);
      renderStats();
    } catch {
      // Se queda el botón para reintentar.
    } finally {
      moreBtn.disabled = false;
    }
  });

  $<HTMLButtonElement>('[data-pl-retry]').addEventListener('click', load);
  load();
}
