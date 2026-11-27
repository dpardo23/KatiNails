import { Hono } from 'hono';
import { requestId, type RequestIdVariables } from './request-id.ts';

// La función de Supabase monta la app bajo /api (supabase/functions/api/index.ts).
export const app = new Hono<{ Variables: RequestIdVariables }>().basePath('/api');

app.use(requestId());

app.get('/health', (c) => c.json({ status: 'ok' }));
