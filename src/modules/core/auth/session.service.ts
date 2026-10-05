import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfig, InjectConfig } from '@common/config';
import { readCookie } from './cookies';
import { createToken, verifyToken } from './signed-token';

/** La cookie solo viaja bajo /admin: `api` y `public` nunca ven la sesión. */
const COOKIE_PATH = '/admin';

/**
 * Sesión en cookie firmada (token HMAC sin estado en el servidor, ver signed-token.ts):
 *     { sub: <id de usuario>, exp }
 * Solo guarda el id de usuario: los roles se leen de la fuente en cada
 * request, así un cambio de rol o una baja aplican de inmediato.
 *
 * Es el ÚNICO lugar que conoce la cookie (nombre, opciones, lectura y borrado):
 * el login normal, el login de desarrollo, el logout y el middleware pasan por acá.
 */
@Injectable()
export class SessionService {
  constructor(@InjectConfig() private readonly config: AppConfig) {}

  /** Duración de la sesión en milisegundos. */
  get ttlMs(): number {
    return this.config.auth.sessionTtlHours * 3600_000;
  }

  /** Inicia sesión para `userId`: deja la cookie firmada en la respuesta. */
  start(res: Response, userId: string): void {
    res.cookie(this.config.auth.cookieName, this.create(userId), {
      httpOnly: true, // inaccesible desde JavaScript del navegador
      sameSite: 'lax', // mitigación parcial de CSRF (ver "Pendiente" del README)
      secure: this.config.auth.cookieSecure,
      path: COOKIE_PATH,
      maxAge: this.ttlMs,
    });
  }

  /** Cierra la sesión: borra la cookie en el navegador. */
  end(res: Response): void {
    res.clearCookie(this.config.auth.cookieName, { path: COOKIE_PATH });
  }

  /** Id del usuario de la sesión del request, o null si no hay cookie o no es válida. */
  userIdFrom(req: Request): string | null {
    return this.verify(this.readCookie(req.headers.cookie));
  }

  /** Genera el token firmado para `userId` (ver signed-token.ts). */
  create(userId: string): string {
    return createToken(this.config.auth.sessionSecret, { sub: userId }, this.ttlMs);
  }

  /** Devuelve el id de usuario si el token es válido y no venció; si no, null. */
  verify(token?: string): string | null {
    const data = verifyToken(this.config.auth.sessionSecret, token);
    return typeof data?.sub === 'string' ? data.sub : null;
  }

  private readCookie(header: string | undefined): string | undefined {
    return readCookie(header, this.config.auth.cookieName);
  }
}
