import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const SONG_SECONDS = 223; // Mr. Brightside dura 3:43
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  scope.querySelector<T>(sel as string) as T | null;
const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<T>(sel));

let lenis: Lenis | null = null;

export function initMotion() {
  if (!reduced) setupLenis();
  setupAnchors();

  if (reduced) {
    root.classList.add('motion-ready');
    staticStates();
    setupStateWatchers();
    return;
  }

  // Estados de partida antes de quitar el pre-ocultado del CSS: sin parpadeo.
  prepareHero();
  root.classList.add('motion-ready');

  const intro = $('[data-intro]');
  const introVisible = intro && getComputedStyle(intro).display !== 'none';
  if (introVisible && intro) runIntro(intro).then(playHero);
  else playHero();

  setupHeroScroll();
  setupReveals();
  setupTour();
  setupLyrics();
  setupAi();
  setupRail();
  setupWrapped();
  setupDesk();
  setupDownloadMark();
  setupStateWatchers();

  // Las imágenes diferidas cambian alturas: recalcular cuando terminan.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* ------------------------------------------------------------------ */

function setupLenis() {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function setupAnchors() {
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href')!;
    if (id === '#') {
      event.preventDefault();
      lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    const target = document.querySelector<HTMLElement>(id);
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -80 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
}

/* ---------------------------- Intro ------------------------------- */

function runIntro(intro: HTMLElement): Promise<void> {
  root.classList.add('intro-run');
  lenis?.stop();

  const mark = $<SVGSVGElement>('[data-intro-mark]', intro)!;
  const vinyl = $<SVGGElement>('[data-intro-vinyl]', intro)!;
  const rings = $<SVGPathElement>('[data-intro-rings]', intro)!;
  const clip = $<SVGRectElement>('[data-intro-clip]', intro)!;
  const navLogo = $('[data-nav-logo]');

  return new Promise((resolve) => {
    const finish = () => {
      intro.style.display = 'none';
      lenis?.start();
      try {
        sessionStorage.setItem('syncora-intro', '1');
      } catch {
        /* nada */
      }
    };

    gsap.set(vinyl, { svgOrigin: '512 512', scale: 0.55, opacity: 0, rotation: -120 });
    gsap.set(rings, { svgOrigin: '512 512', scale: 1.18, opacity: 0 });
    gsap.set(clip, { attr: { y: 1024, height: 0 } });
    if (navLogo) gsap.set(navLogo, { opacity: 0 });

    const spin = gsap.to(vinyl, { rotation: '+=360', duration: 2.4, ease: 'none', repeat: -1 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(vinyl, { scale: 1, opacity: 1, duration: 0.8 }, 0)
      .to(clip, { attr: { y: 0, height: 1024 }, duration: 0.95, ease: 'power3.inOut' }, 0.25)
      .to(vinyl, { scale: 0.86, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.95)
      .to(rings, { scale: 1, opacity: 1, duration: 0.6 }, 1.05)
      .add(() => spin.kill(), 1.45);

    tl.add(() => {
      // FLIP hacia el logo de la barra: el mismo trazo termina en su sitio.
      const from = mark.getBoundingClientRect();
      const to = navLogo?.getBoundingClientRect();
      const fly = gsap.timeline({
        onComplete: () => {
          if (navLogo) gsap.set(navLogo, { opacity: 1 });
          finish();
        },
      });
      if (to && to.width > 0) {
        fly.to(mark, {
          x: to.left + to.width / 2 - (from.left + from.width / 2),
          y: to.top + to.height / 2 - (from.top + from.height / 2),
          scale: to.width / from.width,
          duration: 0.75,
          ease: 'expo.inOut',
        });
      }
      fly.to(intro, { backgroundColor: 'rgba(24, 28, 39, 0)', duration: 0.55, ease: 'power2.out' }, 0.2);
      // El hero entra mientras el logo viaja.
      gsap.delayedCall(0.25, resolve);
    }, 1.55);
  });
}

/* ----------------------------- Hero ------------------------------- */

function prepareHero() {
  gsap.set('[data-hero-reveal]', { y: 36, opacity: 0 });
  gsap.set('[data-hero-phone]', { y: 140, opacity: 0 });
  gsap.set('[data-letter]', { yPercent: 60, opacity: 0 });
  gsap.set('.hero__chip', { scale: 0.8, opacity: 0 });
}

function playHero() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('[data-letter]', { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.045 }, 0)
    .to('[data-hero-reveal]', { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 0.1)
    .to('[data-hero-phone]', { y: 0, opacity: 1, duration: 1.3 }, 0.15)
    .to('.hero__chip', { scale: 1, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'back.out(1.4)' }, 0.55);
}

function setupHeroScroll() {
  const hero = $('[data-hero]');
  if (!hero) return;
  const letters = $$('[data-letter]');
  const mid = (letters.length - 1) / 2;

  // La palabra se abre desde el centro y deja al teléfono solo en escena.
  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  letters.forEach((letter, i) => {
    const side = i - mid;
    tl.to(letter, { xPercent: side * 55, opacity: 0.25, ease: 'none' }, 0);
  });
  tl.to('[data-hero-stage]', { y: -60, scale: 1.04, ease: 'none' }, 0);
  $$('[data-float]').forEach((chip) => {
    tl.to(chip, { y: Number(chip.dataset.float) * 2.4, ease: 'none' }, 0);
  });
}

/* ---------------------------- Reveals ----------------------------- */

function setupReveals() {
  $$('section').forEach((section) => {
    const items = $$('[data-reveal]', section);
    if (!items.length) return;
    gsap.from(items, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: items[0], start: 'top 85%', once: true },
    });
  });
}

/* ----------------------------- Tour ------------------------------- */

function setupTour() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    const phone = $('[data-tour-phone]');
    const steps = $$('[data-tour-step]');
    if (!phone || !steps.length) return;
    const activate = (key: string) => {
      steps.forEach((s) => s.classList.toggle('is-active', s.dataset.tourStep === key));
      $$('[data-screen]', phone).forEach((img) => {
        const k = img.getAttribute('data-screen');
        img.classList.toggle('is-on', k === key);
      });
    };
    activate(steps[0].dataset.tourStep!);
    const triggers = steps.map((step) =>
      ScrollTrigger.create({
        trigger: step,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && activate(step.dataset.tourStep!),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  });
}

/* ---------------------------- Lyrics ------------------------------ */

function setupLyrics() {
  const lines = $$('[data-lyric]');
  const update = () => {
    let current = -1;
    lines.forEach((line, i) => {
      if (line.classList.contains('is-sung')) current = i;
    });
    lines.forEach((line, i) => line.classList.toggle('is-current', i === current));
  };
  lines.forEach((line) => {
    ScrollTrigger.create({
      trigger: line,
      start: 'center 62%',
      onEnter: () => {
        line.classList.add('is-sung');
        update();
      },
      onLeaveBack: () => {
        line.classList.remove('is-sung');
        update();
      },
    });
  });
}

/* ------------------------------ IA -------------------------------- */

function setupAi() {
  const section = $('[data-ai]');
  const typed = $('[data-ai-typed]');
  const status = $('[data-ai-status]');
  const phone = $('[data-ai-phone]');
  if (!section || !typed || !status || !phone) return;

  const text = typed.dataset.text ?? typed.textContent ?? '';
  const result = $('[data-screen="resultado"]', phone);
  typed.textContent = '';
  gsap.set(status, { opacity: 0, y: 8 });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    once: true,
    onEnter: () => {
      const state = { n: 0 };
      gsap
        .timeline()
        .to(state, {
          n: text.length,
          duration: text.length * 0.045,
          ease: 'none',
          onUpdate: () => (typed.textContent = text.slice(0, Math.round(state.n))),
        })
        .to(status, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '+=0.5')
        .add(() => result?.classList.add('is-on'), '<');
    },
  });
}

/* ----------------------------- Rail ------------------------------- */

function setupRail() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    const pin = $('[data-rail-pin]');
    const track = $('[data-rail-track]');
    if (!pin || !track) return;
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
    return () => tween.scrollTrigger?.kill();
  });
}

/* ---------------------------- Wrapped ----------------------------- */

function setupWrapped() {
  const fan = $('[data-wrapped-fan]');
  if (!fan) return;
  const left = $('[data-card="artistas"]', fan);
  const center = $('[data-card="resumen"]', fan);
  const right = $('[data-card="canciones"]', fan);

  // Parten apiladas detrás de la del centro y se abren en abanico.
  const tl = gsap.timeline({
    scrollTrigger: { trigger: fan, start: 'top 85%', end: 'center 55%', scrub: 0.7 },
  });
  if (left) tl.from(left, { xPercent: 64, rotation: 9, y: 30, ease: 'none' }, 0);
  if (right) tl.from(right, { xPercent: -64, rotation: -9, y: 30, ease: 'none' }, 0);
  if (center) tl.from(center, { y: 80, scale: 0.92, ease: 'none' }, 0);
}

/* ----------------------------- PC --------------------------------- */

function setupDesk() {
  const win = $('[data-desk-window]');
  if (!win) return;
  gsap.from(win, {
    rotationX: 22,
    scale: 0.88,
    y: 40,
    ease: 'none',
    scrollTrigger: { trigger: win, start: 'top 95%', end: 'top 30%', scrub: 0.6 },
  });
}

/* ----------------------- Logo de la descarga ---------------------- */

function setupDownloadMark() {
  const mark = $('[data-dl-mark]');
  if (!mark) return;
  const vinyl = $('[data-dl-vinyl]', mark);
  const rings = $('[data-dl-rings]', mark);
  const clef = $('[data-dl-clef]', mark);

  // Cierre: la clave baja hasta el vinilo y el vinilo se vuelve los anillos.
  const tl = gsap.timeline({
    scrollTrigger: { trigger: mark, start: 'top 95%', end: 'top 45%', scrub: 0.6 },
  });
  tl.fromTo(vinyl, { svgOrigin: '512 512', opacity: 1, scale: 1, rotation: -160 }, { opacity: 0, scale: 0.84, rotation: 40, ease: 'none' }, 0)
    .fromTo(rings, { svgOrigin: '512 512', opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, ease: 'none' }, 0.35)
    .fromTo(clef, { y: -520, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out' }, 0);
}

/* ---------------- Barra de navegación y mini reproductor ---------- */

const SECTION_LABELS: [string, string][] = [
  ['[data-hero]', 'Tu música, sin anuncios'],
  ['[data-tour]', 'La app por dentro'],
  ['[data-lyrics]', 'Letras sincronizadas'],
  ['[data-ai]', 'Playlists con IA'],
  ['[data-rail]', 'Y trae más'],
  ['[data-wrapped]', 'Tu resumen del año'],
  ['[data-desk]', 'En tu PC'],
  ['[data-dl]', 'Descárgala gratis'],
  ['#preguntas', 'Preguntas frecuentes'],
];

function setupStateWatchers() {
  const nav = $('[data-nav]');
  const mini = $('[data-mini]');
  const hero = $('[data-hero]');
  const progress = $('[data-mini-progress]');
  const time = $('[data-mini-time]');
  const sectionLabel = $('[data-mini-section]');

  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

    if (nav) {
      const pastHero = hero ? y > hero.offsetHeight * 0.6 : y > 400;
      nav.dataset.state = y < 24 ? 'top' : pastHero && y > lastY + 2 ? 'hidden' : 'solid';
    }
    if (mini && hero) mini.dataset.state = y > hero.offsetHeight * 0.75 ? 'on' : 'off';
    if (progress) progress.style.scale = `${p} 1`;
    if (time) {
      const s = Math.round(p * SONG_SECONDS);
      time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }
    lastY = y;
  };

  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (sectionLabel) {
    SECTION_LABELS.forEach(([selector, label]) => {
      const el = $(selector);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) sectionLabel.textContent = label;
        },
      });
    });
  }
}

/* ------------------- Movimiento reducido -------------------------- */

function staticStates() {
  // Mismo contenido, sin coreografía: el tour cambia de pantalla por
  // posición, las letras ya están encendidas y la IA muestra el resultado.
  setupTour();
  $$('[data-lyric]').forEach((l) => l.classList.add('is-sung'));
  $('[data-screen="resultado"]')?.classList.add('is-on');
}
