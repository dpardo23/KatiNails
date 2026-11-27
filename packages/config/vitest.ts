import { defineConfig, type ViteUserConfig } from 'vitest/config';

interface CoverageOptions {
  /** Porcentaje mínimo de líneas, funciones, ramas y sentencias. */
  threshold: 70 | 90;
  /** Código que mide la cobertura. Por defecto, src/. */
  include?: string[];
  /** Código que se prueba con E2E y no con pruebas unitarias. */
  exclude?: string[];
}

/** Configuración común de Vitest: cobertura con v8 y umbrales que fallan la prueba. */
export function vitestConfig({
  threshold,
  include,
  exclude = [],
}: CoverageOptions): ViteUserConfig {
  return defineConfig({
    test: {
      passWithNoTests: true,
      coverage: {
        provider: 'v8',
        include: include ?? ['src/**/*.{ts,tsx}'],
        exclude: ['**/*.test.{ts,tsx}', '**/*.gen.ts', ...exclude],
        reporter: ['text-summary', 'lcov'],
        thresholds: {
          lines: threshold,
          functions: threshold,
          branches: threshold,
          statements: threshold,
        },
      },
    },
  });
}
