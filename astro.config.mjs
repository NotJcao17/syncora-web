// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Se cambia por el dominio real al desplegar en Cloudflare Pages.
  site: 'https://syncora.pages.dev',
  // Astro 7 pasó a reglas JSX para los espacios entre elementos en línea;
  // con texto en español lleno de <strong> y <a> eso pega palabras.
  compressHTML: true,
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
