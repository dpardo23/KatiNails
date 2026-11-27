import { z } from 'zod';

// Variables públicas de la app, validadas al compilar.
// Si falta una o es inválida, el build se detiene.
const httpsOrLocal = z
  .url()
  .refine(
    (value) =>
      value.startsWith('https://') || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(value),
    'debe usar https (o http://127.0.0.1 en local)',
  );

const appEnvSchema = z.object({
  VITE_SUPABASE_URL: httpsOrLocal,
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  VITE_API_URL: httpsOrLocal,
  // ⚠ Se vuelven obligatorias cuando entren Sentry y los archivos de R2.
  VITE_SENTRY_DSN: z.url().optional(),
  VITE_R2_PUBLIC_URL: httpsOrLocal.optional(),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export function parseAppEnv(raw: Record<string, string | undefined>): AppEnv {
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== undefined && value !== ''),
  );
  const result = appEnvSchema.safeParse(cleaned);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variables de entorno inválidas para la app:\n${problems}`);
  }
  return result.data;
}
