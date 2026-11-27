import type { MiddlewareHandler } from 'hono';

export interface RequestIdVariables {
  requestId: string;
}

const HEADER = 'X-Request-Id';

/**
 * Pone un identificador por solicitud en el contexto (para los registros) y en la respuesta.
 * Siempre lo genera el servidor: un X-Request-Id del cliente se ignora, así nadie falsea la
 * correlación de los registros. (El middleware `requestId` de Hono reutiliza el del cliente.)
 */
export function requestId(): MiddlewareHandler<{ Variables: RequestIdVariables }> {
  return async (c, next) => {
    const id = crypto.randomUUID();
    c.set('requestId', id);
    c.header(HEADER, id);
    await next();
  };
}
