import { vitestConfig } from '@katinails/config/vitest';

// Las páginas de Astro se prueban con E2E y Lighthouse.
export default vitestConfig({ threshold: 70, exclude: ['src/pages/**'] });
