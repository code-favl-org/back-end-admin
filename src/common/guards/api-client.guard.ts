import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Guard GLOBAL que cierra la API a pedidos anónimos "a secas": todo `/api/*`
 * exige un cliente identificado (`req.client`), por ejemplo un navegador que
 * pasó por el sitio y recibió su cookie de visitante.
 *
 * Igual que AuthGuard, NO identifica a nadie: solo exige que `req.client`
 * exista. Quién lo completa es ApiClientMiddleware (core), con la estrategia
 * que corresponda (cookie hoy; API key o JWT mañana).
 *
 * Meta: que la API no la use cualquiera (scrapers, otros sitios) sin pasar por
 * un mecanismo que se pueda limitar, auditar o revocar.
 */
@Injectable()
export class ApiClientGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    if (ctx.getType() !== 'http') return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    if (!/^\/api(\/|\?|$)/.test(req.originalUrl)) return true;
    if (!req.client) {
      // `code` permite al frontend distinguir este 401 y reintentar: la respuesta
      // ya trae la cookie de visitante (ver VisitorCookieStrategy).
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'visitor_required',
        message: 'La API requiere un cliente identificado.',
      });
    }
    return true;
  }
}
