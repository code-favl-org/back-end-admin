import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { AppConfig, InjectConfig } from '@common/config';
import { readCookie } from '../auth/cookies';
import { createToken, verifyToken } from '../auth/signed-token';

/**
 * Cookie ANÓNIMA del sitio público: le da una identidad estable a cada navegador
 * que lo visita, sin que tenga que registrarse.
 *
 * Es la contraparte de la sesión del backoffice (SessionService):
 *  - visitante  -> cookie `favl_visitor`, path `/`      (todo el sitio y la API)
 *  - registrado -> cookie `favl_session`, path `/admin` (solo el backoffice)
 *
 * Una cookie anónima NO es un secreto (cualquiera puede conseguirla visitando
 * el sitio): sirve para saber "esto viene de un navegador que pasó por el
 * sitio", limitar el uso por visitante y poder cortar a uno puntual.
 */
@Injectable()
export class VisitorService {
  constructor(@InjectConfig() private readonly config: AppConfig) {}

  private get ttlMs(): number {
    return this.config.visitor.ttlDays * 24 * 3600_000;
  }

  /**
   * Identifica al visitante del request. Si no trae cookie válida (primera visita,
   * vencida o adulterada) le asigna un id nuevo y deja la cookie en la respuesta.
   * Si trae una válida a mitad de vida o menos, la renueva (sliding).
   *
   * @returns `id` del visitante e `isNew` = true si ESTE request no traía cookie válida.
   */
  ensure(req: Request, res: Response): { id: string; isNew: boolean } {
    const data = verifyToken(this.config.auth.sessionSecret, readCookie(req.headers.cookie, this.config.visitor.cookieName));
    if (typeof data?.vid === 'string') {
      if (data.exp - Date.now() < this.ttlMs / 2) this.start(res, data.vid);
      return { id: data.vid, isNew: false };
    }
    const id = randomUUID();
    this.start(res, id);
    return { id, isNew: true };
  }

  private start(res: Response, id: string): void {
    res.cookie(this.config.visitor.cookieName, createToken(this.config.auth.sessionSecret, { vid: id }, this.ttlMs), {
      httpOnly: true, // el JavaScript de la página no la lee ni la copia
      sameSite: 'lax',
      secure: this.config.auth.cookieSecure,
      path: '/',
      maxAge: this.ttlMs,
    });
  }
}
