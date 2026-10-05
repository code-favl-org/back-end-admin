import { HttpException, HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { API_AUTH_STRATEGIES, ApiAuthStrategy } from './api-auth-strategy';
import { RateLimitService } from './rate-limit.service';

/**
 * IDENTIFICA a quien consume `/api/*`: prueba las estrategias en orden y deja el
 * resultado en `req.client`. Después aplica el límite de uso (429 si se pasa).
 *
 * No bloquea por falta de identidad: eso lo decide ApiClientGuard (common).
 * Se aplica solo a `/api/*` (ver ApiModule.configure).
 */
@Injectable()
export class ApiClientMiddleware implements NestMiddleware {
  constructor(
    @Inject(API_AUTH_STRATEGIES) private readonly strategies: ApiAuthStrategy[],
    private readonly limiter: RateLimitService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Las respuestas dependen de la cookie: ningún caché compartido (CDN/proxy) debe guardarlas
      // y servírselas a quien no se identificó.
      res.setHeader('Cache-Control', 'private');
      res.setHeader('Vary', 'Cookie');

      for (const strategy of this.strategies) {
        const client = await strategy.authenticate(req, res);
        if (client) {
          req.client = client;
          break;
        }
      }

      if (req.client) {
        const wait = this.limiter.hit(req.client.id, req.ip ?? 'desconocida');
        if (wait !== null) {
          res.setHeader('Retry-After', String(wait));
          throw new HttpException('Demasiados pedidos, probá de nuevo en un momento.', HttpStatus.TOO_MANY_REQUESTS);
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  }
}
