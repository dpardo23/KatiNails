import { describe, expect, it } from 'vitest';
import { app } from './app.ts';

describe('api', () => {
  it('T-00 · /api/health responde ok', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
