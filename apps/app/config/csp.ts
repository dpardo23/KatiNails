import type { AppEnv } from './env.ts';

// Política de seguridad de contenido de la app. Sin 'unsafe-inline'.
type Target = 'web' | 'android';

const GOOGLE_GSI = 'https://accounts.google.com/gsi/';
const TURNSTILE = 'https://challenges.cloudflare.com';
const PWNED_PASSWORDS = 'https://api.pwnedpasswords.com';

function origin(url: string): string {
  return new URL(url).origin;
}

function websocketOrigin(url: string): string {
  const parsed = new URL(url);
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  return parsed.origin;
}

function unique(values: readonly (string | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => value !== undefined))];
}

export function buildCsp(env: AppEnv, target: Target): string {
  const supabase = origin(env.VITE_SUPABASE_URL);
  const r2 = env.VITE_R2_PUBLIC_URL === undefined ? undefined : origin(env.VITE_R2_PUBLIC_URL);
  const sentry = env.VITE_SENTRY_DSN === undefined ? undefined : origin(env.VITE_SENTRY_DSN);

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'font-src': ["'self'"],
    'script-src': ["'self'", `${GOOGLE_GSI}client`, TURNSTILE],
    'frame-src': [GOOGLE_GSI, TURNSTILE],
    'style-src': ["'self'", `${GOOGLE_GSI}style`],
    'connect-src': unique([
      "'self'",
      supabase,
      websocketOrigin(env.VITE_SUPABASE_URL),
      origin(env.VITE_API_URL),
      GOOGLE_GSI,
      PWNED_PASSWORDS,
      sentry,
      // El APK descarga las actualizaciones en vivo desde R2.
      target === 'android' ? r2 : undefined,
    ]),
    'img-src': unique(["'self'", 'data:', 'blob:', supabase, r2]),
    'media-src': unique(["'self'", r2]),
  };

  // frame-ancestors no funciona en <meta>; en la web va en el encabezado (_headers).
  if (target === 'web') directives['frame-ancestors'] = ["'none'"];

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
    .join('; ');
}

const SECURITY_HEADERS = [
  'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options: nosniff',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy: same-origin-allow-popups',
  'X-Frame-Options: DENY',
];

/** Archivo `_headers` de Cloudflare para la app web. */
export function buildHeadersFile(env: AppEnv): string {
  return [
    '/*',
    ...SECURITY_HEADERS.map((header) => `  ${header}`),
    `  Content-Security-Policy: ${buildCsp(env, 'web')}`,
    '',
    '# Archivos con huella: se guardan un año',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '# El service worker se revalida siempre (Cloudflare ya revalida el HTML por defecto)',
    '/sw.js',
    '  Cache-Control: no-cache',
    '',
  ].join('\n');
}
