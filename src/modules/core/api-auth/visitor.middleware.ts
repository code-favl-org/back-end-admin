import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { VisitorService } from './visitor.service';

/**
 * Entrega la cookie de visitante cuando el navegador pide una PÁGINA del sitio
 * (HTML), para que la tenga antes de la primera llamada a la API. Se aplica a
 * todo menos /api, /admin y /static (ver PublicModule.configure).
 */
@Injectable()
export class VisitorMiddleware implements NestMiddleware {
  constructor(private readonly visitors: VisitorService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'GET' && req.accepts(['html', 'json']) === 'html') this.visitors.ensure(req, res);
    next();
  }
}
