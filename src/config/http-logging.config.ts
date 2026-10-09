import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { createWriteStream, mkdirSync } from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
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

/** Cookie names from the incoming Cookie header; values are deliberately never logged. */
function incomingCookies(req: IncomingMessage): string {
  const header = req.headers.cookie;
  if (!header) return '[]';

  const names = header.split(';').flatMap((cookie) => {
    const separator = cookie.indexOf('=');
    return separator < 0 ? [] : [cookie.slice(0, separator).trim()].filter(Boolean);
  });
  return JSON.stringify(names);
}

/** Set-Cookie names and safe attributes, excluding each cookie's credential value. */
function outgoingCookies(res: ServerResponse): string {
  const header = res.getHeader('set-cookie');
  const cookies = (Array.isArray(header) ? header : header ? [String(header)] : []).map((cookie) => {
    const [pair, ...parts] = cookie.split(';');
    const name = pair.slice(0, pair.indexOf('=')).trim();
    const attributes = parts
      .map((part) => part.trim())
      .filter((part) => /^(path|domain|max-age|expires|samesite|secure|httponly)(=|$)/i.test(part));
    return { name, attributes };
  });
  return JSON.stringify(cookies);
}

function isStaticAssetRequest(req: IncomingMessage): boolean {
  const request = req as Request;
  const requestUrl = request.originalUrl || request.url || '/';
  const pathname = requestUrl.split('?')[0].toLowerCase();
  return ['/static', '/public','/.well-known'].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Arma la línea de log: fecha ISO, método, ruta, estado y duración (igual que back-end-public), más
 * el cuerpo del pedido cuando lo trae (`dto={...}`).
 *
 * Se usa una función en lugar de la cadena de formato (`':date[iso] :method :url ...'`) porque
 * morgan escapa las comillas de los valores de los tokens: `{"usuario":"admin"}` saldría como
 * `{\"usuario\":\"admin\"}`. Con la función, el cuerpo se lee tal cual.
 */
function formatLine(tokens: morgan.TokenIndexer, req: IncomingMessage, res: ServerResponse): string | undefined {
  if (isStaticAssetRequest(req)) return undefined;

  const line = [
    tokens.date(req, res, 'iso'),
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    `${tokens['response-time'](req, res)} ms`,
    `cookies_in=${incomingCookies(req)}`,
    `cookies_out=${outgoingCookies(res)}`,
  ].join(' ');

  return line + dto(req);
}

/**
 * Registra cada pedido en consola y en `logs/http-requests.log`.
 *
 * Igual que back-end-public (`morgan` con el stream al `Logger` de Nest), con el cuerpo del pedido
 * agregado al final: así, al probar desde Swagger o desde un formulario, se ve qué datos llegaron
 * además del método, la ruta, el estado y la duración. Las contraseñas y los tokens salen
 * enmascarados (`***`). Para diagnosticar sesiones, registra nombres de cookies entrantes y
 * nombres/atributos de cookies salientes, nunca sus valores.
 *
 * Se registra antes que los estáticos y que Swagger; las rutas `/static/` y `/public/` se excluyen.
 *
 * @param app Aplicación ya creada, antes de `listen()`.
 */
export function setupHttpLogging(app: INestApplication, enabled: boolean) {
  if (!enabled) return;

  const logger = new Logger('HTTP');
  const logDirectory = join(process.cwd(), 'logs');
  mkdirSync(logDirectory, { recursive: true });
  const fileStream = createWriteStream(join(logDirectory, 'http-requests.log'), { flags: 'a' });
  fileStream.on('error', (error) => logger.error(`No se pudo escribir logs/http-requests.log: ${error.message}`));

  app.use(
    morgan(formatLine, {
      skip: isStaticAssetRequest,
      stream: {
        write: (message: string) => {
          logger.log(message.trim());
          fileStream.write(message);
        },
      },
    }),
  );
}
