// Edge Function `api`: envuelve la app de Hono de apps/api. Corre en Deno.
import { app } from '../../../apps/api/src/app.ts';

Deno.serve(app.fetch);
