import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '../../common/types';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

/**
 * AUTENTICA: completa `req.user` (y `res.locals.user`) desde las cookies. No bloquea nada:
 * decidir si se puede pasar es trabajo de los guards de common.
 *
 *  1. access token válido            -> usuario (sin tocar la base)
 *  2. access vencido/ausente + refresh válido -> se renueva el par, se reenvían las cookies
 *  3. nada válido                    -> sin usuario (el guard redirige al login)
 *
 * El vencimiento del access token (rutina: dura `AUTH_ACCESS_TOKEN_TTL_MINUTES`) no lanza
 * excepción: `readAccessToken` devuelve `undefined` y acá se renueva.
 *
 * Se aplica solo a `/admin/*` (ver AppModule.configure).
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const { accessToken, refreshToken } = this.sessions.tokensFrom(req);
      let user: AuthUser | undefined;

      if (accessToken) {
        try {
          // Vencido => `undefined` (sin excepción): abajo se renueva con el refresh.
          user = await this.auth.readAccessToken(accessToken);
        } catch (error) {
          if (!(error instanceof UnauthorizedException)) throw error;
        }
      }

      if (!user && refreshToken) {
        try {
          const tokens = await this.auth.refresh(refreshToken);
          this.sessions.start(req, res, tokens);
          user = tokens.user;
        } catch (error) {
          if (!(error instanceof UnauthorizedException)) throw error;
        }
      }

      req.user = user;
      res.locals.user = user;
      next();
    } catch (err) {
      next(err);
    }
  }
}
