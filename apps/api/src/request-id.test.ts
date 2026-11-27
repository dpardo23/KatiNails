import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';
import { requestId, type RequestIdVariables } from './request-id.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function appWithRequestId() {
  const app = new Hono<{ Variables: RequestIdVariables }>();
  app.use(requestId());
  app.get('/id', (c) => c.text(c.get('requestId')));
  app.get('/raw', () => new Response('raw'));
  app.get('/boom', () => {
    throw new Error('boom');
  });
  app.get('/denied', () => {
    throw new HTTPException(401);
  });
  return app;
}

describe('T-01 · middleware requestId', () => {
  it('T-01 · pone un UUID v4 en X-Request-Id', async () => {
    const res = await appWithRequestId().request('/id');
    expect(res.headers.get('X-Request-Id')).toMatch(UUID);
  });

  it('T-01 · el mismo id queda en el contexto para los registros', async () => {
    const res = await appWithRequestId().request('/id');
    expect(await res.text()).toBe(res.headers.get('X-Request-Id'));
  });

  it('T-01 · ignora el X-Request-Id del cliente', async () => {
    const sent = 'a1b2c3d4-0000-4000-8000-000000000000';
    const res = await appWithRequestId().request('/id', { headers: { 'X-Request-Id': sent } });
    expect(res.headers.get('X-Request-Id')).toMatch(UUID);
    expect(res.headers.get('X-Request-Id')).not.toBe(sent);
  });

  it('T-01 · cada solicitud recibe un id distinto', async () => {
    const app = appWithRequestId();
    const [a, b] = await Promise.all([app.request('/id'), app.request('/id')]);
    expect(a.headers.get('X-Request-Id')).toMatch(UUID);
    expect(b.headers.get('X-Request-Id')).toMatch(UUID);
    expect(a.headers.get('X-Request-Id')).not.toBe(b.headers.get('X-Request-Id'));
  });

  it.each(['/raw', '/boom', '/denied'])(
    'T-01 · también lo trae una respuesta directa, un error o una excepción HTTP (%s)',
    async (path) => {
      const res = await appWithRequestId().request(path);
      expect(res.headers.get('X-Request-Id')).toMatch(UUID);
    },
  );
});
