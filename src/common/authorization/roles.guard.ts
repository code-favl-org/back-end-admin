import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';
import { STRICT_ROLES_KEY } from './strict-roles.decorator';
import { canAccess } from './can-access';
import type { Role } from '../types/role';

/** Guard GLOBAL (corre después de AuthGuard): aplica @Roles(...) y @StrictRoles(...). */
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

    // @StrictRoles no deja pasar a admin por el solo hecho de serlo.
    const strict = this.reflector.getAllAndOverride<Role[]>(STRICT_ROLES_KEY, targets);
    if (strict?.length && !strict.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
