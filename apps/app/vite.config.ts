import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { buildCsp, buildHeadersFile } from './config/csp.ts';
import { parseAppEnv, type AppEnv } from './config/env.ts';

// Web: la CSP y los encabezados van en dist/_headers (Cloudflare).
// APK (--mode android): no hay _headers; la CSP va en un <meta> del index.html.
function securityPolicy(env: AppEnv, android: boolean): Plugin {
  return {
    name: 'katinails-security-policy',
    apply: 'build',
    transformIndexHtml() {
      if (!android) return [];
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: buildCsp(env, 'android') },
          injectTo: 'head-prepend',
        },
      ];
    },
    generateBundle() {
      if (android) return;
      this.emitFile({ type: 'asset', fileName: '_headers', source: buildHeadersFile(env) });
    },
  };
}

// En el build del APK no hay service worker: las actualizaciones llegan en vivo desde R2.
export default defineConfig(({ command, mode }) => {
  const android = mode === 'android';
  const plugins = [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      disable: android,
      registerType: 'prompt',
      manifest: {
        name: 'Katinails',
        short_name: 'Katinails',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
      },
    }),
  ];
  if (command === 'build') {
    const env = parseAppEnv(loadEnv(mode, process.cwd(), 'VITE_'));
    plugins.push(securityPolicy(env, android));
  }
  return {
    plugins,
    build: {
      target: ['chrome111', 'edge111', 'safari16.4'],
    },
  };
});
