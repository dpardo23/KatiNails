import { describe, expect, it } from 'vitest';
import { app } from './app.ts';

describe('api', () => {
  it('T-00 · /api/health responde ok', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

describe('T-01 · request_id en la app', () => {
  it('T-01 · /api/health trae X-Request-Id', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('T-01 · una ruta que no existe también trae X-Request-Id', async () => {
    const res = await app.request('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });
});
