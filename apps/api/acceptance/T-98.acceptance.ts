import { expect, test } from 'vitest';
import { callApi } from './support/api.ts';

// Demostración: esta prueba ya pasa antes de implementar nada, así que `.fails` debe hacer fallar el CI.
test.fails('T-98 · /health ya responde 200', async () => {
  const res = await callApi('/health');
  expect(res.status).toBe(200);
});
