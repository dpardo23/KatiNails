import { defineConfig } from 'vitest/config';

// Pruebas de aceptación: hablan con la API por HTTP, a través de Supabase local (Kong y el runtime
// de Deno), igual que la app. Cada archivo cubre un identificador (`T-01.acceptance.ts`).
// Mientras la función no existe, cada prueba se marca con `test.fails`: el CI comprueba que falla.
export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ['**/*.acceptance.ts'],
    globalSetup: ['./support/health.ts'],
    passWithNoTests: true,
    testTimeout: 15_000,
  },
});
