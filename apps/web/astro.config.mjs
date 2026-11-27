// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// CSP en <meta> con hashes
export default defineConfig({
  site: 'https://katinails.com',
  output: 'static',
  integrations: [react(), mdx(), sitemap()],
  security: {
    csp: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
