// Fronteras entre paquetes: qué puede importar cada app y cada paquete.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-sin-dependencias',
      comment: 'packages/domain no depende de nadie: ni de otros paquetes ni de librerías.',
      severity: 'error',
      from: { path: '^packages/domain/src' },
      to: { pathNot: '^packages/domain/src' },
    },
    {
      name: 'compartido-sin-node',
      comment: 'domain y contracts se usan también desde Deno: sin APIs de Node.',
      severity: 'error',
      from: { path: '^packages/(domain|contracts)/src' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'contracts-solo-zod',
      comment: 'contracts solo usa Zod y domain.',
      severity: 'error',
      from: { path: '^packages/contracts/src' },
      to: {
        dependencyTypes: ['npm', 'npm-dev', 'npm-peer', 'npm-optional'],
        pathNot: '/node_modules/zod/',
      },
    },
    {
      name: 'apps-no-se-importan-entre-si',
      comment: 'Una app no importa código de otra app (supabase/functions/api es la excepción).',
      severity: 'error',
      from: { path: '^apps/([^/]+)/' },
      to: { path: '^apps/([^/]+)/', pathNot: '^apps/$1/' },
    },
    {
      name: 'sin-ciclos',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|coverage|\\.astro|android)/|routeTree\\.gen\\.ts$' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'default'],
    },
  },
};
