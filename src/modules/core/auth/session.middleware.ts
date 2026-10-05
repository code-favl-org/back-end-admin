import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';

/**
 * AUTENTICA: lee la cookie de sesión y completa `req.user` (y `res.locals.user`
 * para las vistas). No bloquea nada: decidir si se puede pasar es trabajo de
 * los guards de common.
 *
 * Se aplica solo a `/admin/*` (ver BackofficeModule.configure).
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    private readonly sessions: SessionService,
    private readonly users: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.sessions.userIdFrom(req);
      // Se busca el usuario en cada request: si lo dieron de baja, la sesión deja de valer.
      const record = userId ? await this.users.findById(userId) : undefined;
      if (record) req.user = this.users.toAuthUser(record);
      res.locals.user = req.user;
      next();
    } catch (err) {
      next(err);
    }
  }
}
