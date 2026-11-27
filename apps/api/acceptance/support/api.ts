// URL de la API en Supabase local. En el CI y en local es la misma.
const DEFAULT_API_URL = 'http://127.0.0.1:56321/functions/v1/api';

const apiUrl = process.env['ACCEPTANCE_API_URL'] ?? DEFAULT_API_URL;

/** Solicitud HTTP real a la API (sin simulaciones). */
export function callApi(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiUrl}${path}`, init);
}
