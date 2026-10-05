import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Token firmado sin estado en el servidor (HMAC-SHA256):
 *     base64url(payload + exp) . base64url(firma)
 * Lo comparten la sesión del backoffice y la cookie de visitante del sitio
 * público, así la firma se escribe (y se audita) una sola vez.
 */

const sign = (secret: string, payload: string) => createHmac('sha256', secret).update(payload).digest('base64url');

/** Crea un token con `data` y vencimiento `ttlMs` desde ahora. */
export function createToken(secret: string, data: Record<string, unknown>, ttlMs: number): string {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlMs })).toString('base64url');
  return `${payload}.${sign(secret, payload)}`;
}

/** Devuelve el contenido (incluye `exp`) si la firma es válida y no venció; si no, null. */
export function verifyToken(secret: string, token?: string): ({ exp: number } & Record<string, unknown>) | null {
  if (!token) return null;
  const [payload, signature, ...rest] = token.split('.');
  if (!payload || !signature || rest.length) return null;

  // Comparación en tiempo constante para no filtrar la firma por timing.
  const expected = Buffer.from(sign(secret, payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof data?.exp === 'number' && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}
