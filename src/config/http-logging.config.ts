import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Request } from 'express';
import morgan from 'morgan';

/** Campos que nunca se escriben en el log, aunque vengan en el cuerpo del pedido. */
const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordconfirm',
  'passwordretype',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authorization',
]);

/** Recorte del cuerpo mostrado, para que una carga grande no ensucie la consola. */
const MAX_BODY_LENGTH = 400;

/**
 * Reemplaza por `***` los valores de los campos sensibles, incluso anidados en objetos o arrays.
 */
function maskSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSensitive);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_FIELDS.has(key.toLowerCase()) ? '***' : maskSensitive(item),
      ]),
    );
  }
  return value;
}

/**
 * Cuerpo del pedido como ` dto={...}` (con el espacio adelante) o `''` si no hay datos.
 *
 * Morgan llama a `formatLine` recién cuando termina la respuesta, así que el cuerpo ya está
 * parseado aunque el logger se registre antes que los parsers de Nest.
 */
function dto(req: IncomingMessage): string {
  const body = (req as Request).body as unknown;
  if (body == null) return '';

  try {
    const json = JSON.stringify(maskSensitive(body));
    if (!json || json === '{}' || json === '[]') return '';
    return ` dto=${json.length > MAX_BODY_LENGTH ? `${json.slice(0, MAX_BODY_LENGTH)}…` : json}`;
  } catch {
    return ' dto=<no serializable>';
  }
}

/**
 * Arma la línea de log: fecha ISO, método, ruta, estado y duración (igual que back-end-public), más
 * el cuerpo del pedido cuando lo trae (`dto={...}`).
 *
 * Se usa una función en lugar de la cadena de formato (`':date[iso] :method :url ...'`) porque
 * morgan escapa las comillas de los valores de los tokens: `{"usuario":"admin"}` saldría como
 * `{\"usuario\":\"admin\"}`. Con la función, el cuerpo se lee tal cual.
 */
function formatLine(tokens: morgan.TokenIndexer, req: IncomingMessage, res: ServerResponse): string {
  const line = [
    tokens.date(req, res, 'iso'),
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    `${tokens['response-time'](req, res)} ms`,
  ].join(' ');

  return line + dto(req);
}

/**
 * REGISTRA EN CONSOLA: cada pedido que pasa por Express, con su cuerpo.
 *
 * Igual que back-end-public (`morgan` con el stream al `Logger` de Nest), con el cuerpo del pedido
 * agregado al final: así, al probar desde Swagger o desde un formulario, se ve qué datos llegaron
 * además del método, la ruta, el estado y la duración. Las contraseñas y los tokens salen
 * enmascarados (`***`).
 *
 * Se registra antes que los estáticos y que Swagger para que también queden en el log.
 *
 * @param app Aplicación ya creada, antes de `listen()`.
 */
export function setupHttpLogging(app: INestApplication) {
  const logger = new Logger('HTTP');

  app.use(
    morgan(formatLine, {
      stream: {
        write: (message: string) => logger.log(message.trim()),
      },
    }),
  );
}
