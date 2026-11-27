import { Hono } from 'hono';

// La función de Supabase monta la app bajo /api (supabase/functions/api/index.ts).
export const app = new Hono().basePath('/api');

app.get('/health', (c) => c.json({ status: 'ok' }));
