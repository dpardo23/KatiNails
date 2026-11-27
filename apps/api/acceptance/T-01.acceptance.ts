import { describe, expect, test } from 'vitest';
import { callApi } from './support/api.ts';

// T-01 · request_id en cada respuesta de la API (issue #7).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('T-01 · request_id en cada respuesta', () => {
  test.fails('T-01 · /health responde con un X-Request-Id generado por el servidor', async () => {
    const res = await callApi('/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toMatch(UUID);
  });

  test.fails('T-01 · una ruta que no existe también trae X-Request-Id', async () => {
    const res = await callApi('/no-existe');
    expect(res.status).toBe(404);
    expect(res.headers.get('x-request-id')).toMatch(UUID);
  });

  test.fails('T-01 · dos solicitudes reciben identificadores distintos', async () => {
    const [first, second] = await Promise.all([callApi('/health'), callApi('/health')]);
    expect(first.headers.get('x-request-id')).toMatch(UUID);
    expect(second.headers.get('x-request-id')).toMatch(UUID);
    expect(first.headers.get('x-request-id')).not.toBe(second.headers.get('x-request-id'));
  });

  test.fails('T-01 · ignora el X-Request-Id que envía el cliente', async () => {
    const sent = 'a1b2c3d4-0000-4000-8000-000000000000';
    const res = await callApi('/health', { headers: { 'X-Request-Id': sent } });
    expect(res.headers.get('x-request-id')).toMatch(UUID);
    expect(res.headers.get('x-request-id')).not.toBe(sent);
  });
});
