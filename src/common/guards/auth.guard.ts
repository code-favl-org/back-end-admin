import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * Guard GLOBAL, "deny by default": toda ruta exige usuario salvo que esté
 * marcada con @Public(). Si alguien se olvida de marcar una ruta pública,
 * el error es un 401 visible (falla cerrado), no una puerta abierta.
 *
 * Esta guard NO autentica: solo exige que `req.user` exista. Quién lo
 * completa es el middleware de sesión de core (ver SessionMiddleware).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (ctx.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user) throw new UnauthorizedException();
    return true;
  }
}
