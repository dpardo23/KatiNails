import { describe, expect, it } from 'vitest';
import { buildCsp, buildHeadersFile } from './csp.ts';
import { parseAppEnv } from './env.ts';

const env = parseAppEnv({
  VITE_SUPABASE_URL: 'https://abc.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_xxxxxxxxxxxxxxxxxxxx',
  VITE_API_URL: 'https://abc.supabase.co/functions/v1/api',
  VITE_SENTRY_DSN: 'https://key@o1.ingest.us.sentry.io/2',
  VITE_R2_PUBLIC_URL: 'https://media.katinails.com',
});

function directive(csp: string, name: string): string[] {
  const found = csp.split('; ').find((part) => part.startsWith(`${name} `));
  return found?.split(' ').slice(1) ?? [];
}

describe('RNF-SES-001 · CSP de la app', () => {
  it('nunca permite scripts ni estilos en línea', () => {
    for (const target of ['web', 'android'] as const) {
      expect(buildCsp(env, target)).not.toContain('unsafe-inline');
      expect(buildCsp(env, target)).not.toContain('unsafe-eval');
    }
  });

  it('conecta con Supabase por https y wss, la API, Google, HIBP y Sentry', () => {
    const connect = directive(buildCsp(env, 'web'), 'connect-src');
    expect(connect).toEqual(
      expect.arrayContaining([
        'https://abc.supabase.co',
        'wss://abc.supabase.co',
        'https://accounts.google.com/gsi/',
        'https://api.pwnedpasswords.com',
        'https://o1.ingest.us.sentry.io',
      ]),
    );
  });

  it('solo el APK conecta con R2 (actualizaciones en vivo)', () => {
    expect(directive(buildCsp(env, 'web'), 'connect-src')).not.toContain(
      'https://media.katinails.com',
    );
    expect(directive(buildCsp(env, 'android'), 'connect-src')).toContain(
      'https://media.katinails.com',
    );
  });

  it('frame-ancestors solo en el encabezado web, no en el <meta> del APK', () => {
    expect(directive(buildCsp(env, 'web'), 'frame-ancestors')).toEqual(["'none'"]);
    expect(buildCsp(env, 'android')).not.toContain('frame-ancestors');
  });

  it('_headers lleva HSTS, nosniff y la CSP', () => {
    const headers = buildHeadersFile(env);
    expect(headers).toContain(
      'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
    );
    expect(headers).toContain('X-Content-Type-Options: nosniff');
    expect(headers).toContain('Content-Security-Policy: default-src');
  });

  it('rechaza variables inválidas', () => {
    expect(() =>
      parseAppEnv({ VITE_SUPABASE_URL: 'http://evil.example', VITE_API_URL: 'x' }),
    ).toThrow(/Variables de entorno inválidas/);
  });
});
