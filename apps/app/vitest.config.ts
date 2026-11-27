import { vitestConfig } from '@katinails/config/vitest';

// main.tsx y las rutas se prueban con E2E (Playwright).
export default vitestConfig({
  threshold: 70,
  include: ['src/**/*.{ts,tsx}', 'config/**/*.ts'],
  exclude: ['src/main.tsx', 'src/routes/**'],
});
