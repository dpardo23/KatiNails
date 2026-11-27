import { callApi } from './api.ts';

const ATTEMPTS = 30;
const WAIT_MS = 1_000;

// Antes de las pruebas, la API debe responder. Si no responde, la suite entera falla aunque las
// pruebas estén marcadas con `test.fails`: así una API caída nunca pasa por una prueba "en rojo".
export async function setup(): Promise<void> {
  let lastError = 'sin respuesta';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const res = await callApi('/health');
      const body: unknown = await res.json();
      if (res.status === 200 && JSON.stringify(body) === '{"status":"ok"}') return;
      lastError = `estado ${String(res.status)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
  }
  throw new Error(`La API no responde en /health: ${lastError}`);
}
