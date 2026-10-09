import { Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfig, InjectConfig } from '../../config';
import type { AuthTokens } from './auth.service';

/** Cookies de sesión del backoffice (access + refresh + marcadora de admin), todas bajo ADMIN_COOKIE_PATH. */
@Injectable()
export class SessionService {
  constructor(@InjectConfig() private readonly config: AppConfig) {}

  private get options(): CookieOptions {
    return { httpOnly: true, secure: this.config.auth.cookieSecure, sameSite: 'lax', path: this.config.auth.cookiePath };
  }

  /** Tokens que trae el pedido (cookie-parser). */
  tokensFrom(req: Request): { accessToken?: string; refreshToken?: string } {
    const { accessCookie, refreshCookie } = this.config.auth;
    return { accessToken: req.cookies?.[accessCookie], refreshToken: req.cookies?.[refreshCookie] };
  }

  /** Guarda los tokens en cookies (y los deja también en `req.cookies` para el resto del pedido). */
  start(req: Request, res: Response, tokens: AuthTokens): void {
      console.log('SessionService.start NUEVO');
    const { auth } = this.config;
    const maxAge = Math.max(0, Math.min(auth.cookieTtlMs, tokens.refreshExpiresAt.getTime() - Date.now()));

    res.cookie(auth.accessCookie, tokens.accessToken, { ...this.options, maxAge });
    res.cookie(auth.refreshCookie, tokens.refreshToken, { ...this.options, maxAge });
    
    // Misma cookie marcadora que setea back-end-public: es solo informativa, nunca autoriza nada.
    // if (tokens.user.roles.some((r) => auth.adminCookieRoles.includes(r))) {
    //   res.cookie(auth.adminCookie, tokens.user.roles[0], { ...this.options, maxAge });
    // }

    req.cookies = { ...req.cookies, [auth.accessCookie]: tokens.accessToken, [auth.refreshCookie]: tokens.refreshToken };
  }

  end(res: Response): void {
    const { auth } = this.config;
    for (const name of [auth.accessCookie, auth.refreshCookie]) res.clearCookie(name, this.options);
  }
}
