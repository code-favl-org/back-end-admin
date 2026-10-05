import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../decorators';
import { canAccess, Role } from '../types';

/** Guard GLOBAL (corre después de AuthGuard): aplica @Roles(...). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (ctx.getType() !== 'http') return true;

    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    const user = ctx.switchToHttp().getRequest<Request>().user;
    if (!user || !canAccess(user.roles, required)) throw new ForbiddenException();
    return true;
  }
}
