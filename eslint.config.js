// @ts-check
// Configuración única de ESLint (flat config).
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '.herramientas/',
    '**/dist/',
    '**/coverage/',
    '**/.astro/',
    '**/.turbo/',
    'apps/app/android/',
    'apps/app/src/routeTree.gen.ts',
    'packages/db/src/database.types.ts',
    'supabase/functions/',
  ]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs', 'apps/*/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true },
      ],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    // Tareas de mise escritas en Node: no tienen extensión, así que se nombran una por una.
    files: [
      '.mise/tasks/entorno/env',
      '.mise/tasks/github/configurar',
      '.mise/tasks/secretos/github',
      '.mise/tasks/secretos/supabase',
    ],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node, sourceType: 'module' },
  },
  {
    files: ['apps/app/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}', 'apps/web/**/*.tsx'],
    extends: [reactHooks.configs.flat['recommended-latest'], jsxA11y.configs.recommended],
    languageOptions: { globals: globals.browser },
  },
  // Accesibilidad en .astro: el preset jsx-a11y de eslint-plugin-astro exige el plugin original,
  // que no admite ESLint 10. Se cubre con pruebas de axe.
  ...astro.configs['flat/recommended'],
  {
    // astro-eslint-parser no admite projectService
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { projectService: false, project: true } },
  },
);
