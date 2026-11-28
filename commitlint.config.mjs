// Conventional Commits. El mismo archivo en el hook y en el CI.
const SCOPES = [
  'app',
  'web',
  'api',
  'android',
  'db',
  'domain',
  'ui',
  'auth',
  'reservas',
  'pagos',
  'citas',
  'fidelidad',
  'membresias',
  'tienda',
  'finanzas',
  'oficina',
  'inventario',
  'cotizador',
  'avisos',
  'ayuda',
  'infra',
  'ci',
  'deps',
  'docs',
  'adr',
  'repo',
];

// Solo se admiten estos pies: ningún Co-authored-by ni otro pie.
const ALLOWED_TRAILERS = /^(Refs|BREAKING CHANGE)$/;

// Los commits de Dependabot (pie Signed-off-by y ámbito deps-dev) no siguen estas reglas.
// Su PR se fusiona con squash y el título queda como mensaje.
// Un Co-authored-by nunca se exime.
const isDependabot = (message) =>
  /^Signed-off-by: dependabot\[bot\] <support@github\.com>$/m.test(message) &&
  !/^co-authored-by:/im.test(message);

export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [isDependabot],
  rules: {
    'scope-enum': [2, 'always', SCOPES],
    // En su lugar va subject-no-leading-capital: admite siglas e identificadores (RLS, HU-RES-001).
    'subject-case': [0],
    'subject-no-leading-capital': [2, 'always'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'only-allowed-trailers': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        // Rechaza "Agrega algo" y "AGREGA ALGO"; admite "agrega RLS", "HU-RES-001 reserva" y "T-01 algo".
        'subject-no-leading-capital': ({ subject }) => {
          const text = subject ?? '';
          const capitalized = /^\p{Lu}\p{Ll}/u.test(text);
          const shouting = /\p{L}{2,}/u.test(text) && !/\p{Ll}/u.test(text);
          return [
            !capitalized && !shouting,
            'el asunto empieza en minúscula (se admiten siglas e identificadores: RLS, HU-RES-001)',
          ];
        },
        'only-allowed-trailers': ({ raw, footer }) => {
          // Pies = líneas "Token: valor" del pie. Co-authored-by se rechaza en cualquier línea.
          const footerLines = (footer ?? '').split('\n');
          const bad = footerLines.filter((line) => {
            const match = /^([A-Za-z][A-Za-z-]*(?: [A-Z]+)?):\s/.exec(line);
            return match !== null && !ALLOWED_TRAILERS.test(match[1] ?? '');
          });
          const coauthor = (raw ?? '').split('\n').filter((line) => /^co-authored-by:/i.test(line));
          const all = [...new Set([...bad, ...coauthor])];
          return [all.length === 0, `pie no permitido: ${all.join(' | ')}`];
        },
      },
    },
  ],
};
