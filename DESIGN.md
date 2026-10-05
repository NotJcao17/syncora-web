# Design

Sistema visual de la web de Syncora. La identidad sale de la app (`lib/core/theme/app_theme.dart`);
la web la lleva a escala de cartel.

## Tema

Nocturno: la gente llega desde el teléfono, muchas veces de noche y con audífonos, igual que usa
la app. Azul noche como fondo, índigo como acento de marca, y un solo color cálido ("ember",
el naranja de las tarjetas del Wrapped) que vive únicamente en su sección.

## Color (OKLCH)

| Token | Valor | Uso |
|---|---|---|
| `night` | `oklch(0.228 0.022 269.1)` | Fondo (#181C27 de la app) |
| `night-deep` | `oklch(0.175 0.019 270.3)` | Secciones más oscuras (letras, descarga, PC) |
| `surface` / `surface-2` | `oklch(0.267 0.027 260)` / `oklch(0.3 0.03 260.5)` | Tarjetas y paneles |
| `ink` | `oklch(1 0 0)` | Texto principal |
| `ink-2` | `oklch(0.78 0.022 256)` | Texto secundario (≈8:1 sobre night) |
| `ink-3` | `oklch(0.66 0.028 255)` | Apoyo (≥5:1) |
| `indigo` | `oklch(0.585 0.204 277.1)` | Acento (#6366F1) |
| `indigo-deep` | `oklch(0.52 0.21 277.5)` | Fondo de botones (blanco encima ≥5:1) |
| `indigo-night` | `oklch(0.29 0.12 277)` | Sección de IA |
| `ember` / `ember-deep` | `oklch(0.594 0.188 37.9)` / `oklch(0.42 0.135 36.1)` | Solo la sección del Wrapped |

Estrategia: comprometida. El índigo carga los momentos clave (luz del hero, botones, sección de
IA); el naranja aparece una vez, como cambio de escena.

## Tipografía

Una sola familia, **Archivo** variable con eje de anchura (62 %–125 %), elegida por voz: cartel
de concierto. El contraste viene del ancho y el peso, no de mezclar fuentes.

- Palabra gigante del hero: 125 % de ancho, peso 900, `min(14.6vw, 17rem)` (es gráfico, `aria-hidden`).
- Títulos: 112–120 % de ancho, peso 800–850, tracking −0.03 a −0.04 em, `text-wrap: balance`.
- Texto: 100 %, 17–20 px, interlineado 1.6–1.65, máximo ~60 caracteres.

## Componentes

- **Teléfono** (`Phone.astro`): marco tipo Pixel, cámara perforada, todo en `cqw` del propio
  teléfono. Capturas reales con capas para cambiar de pantalla.
- **Botones**: píldora de 52 px; primario índigo, claro blanco, fantasma translúcido.
- **Píldoras flotantes** del hero: superficie con sombra, solo tres.
- **Mini reproductor**: el mismo gesto que la app. Barra de progreso = progreso de la página,
  tiempo sobre 3:43 (Mr. Brightside), botón de descarga siempre a mano.

## Movimiento

- Intro solo en la primera visita de la sesión: vinilo → clave de sol → anillos → logo que vuela a
  la barra. Respaldo CSS que la retira sola si el JS falla.
- Curvas: `expo.out` para entradas, `none` con `scrub` para lo ligado al scroll. Nada de rebotes
  salvo las píldoras del hero (`back.out(1.4)`, sutil).
- Cada sección tiene su propio gesto: la palabra se abre, el teléfono se queda fijo y cambia de
  pantalla, las letras se encienden, la IA escribe, el carril avanza en horizontal, las tarjetas se
  abren en abanico, la ventana de PC se endereza y el logo se arma al final.
- `prefers-reduced-motion`: sin Lenis ni coreografía; mismo contenido, estados finales.
