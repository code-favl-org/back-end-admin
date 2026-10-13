import { SetMetadata } from '@nestjs/common';
import type { Role } from '../types/role';

export const STRICT_ROLES_KEY = 'strictRoles';

/**
 * Como `@Roles`, pero **sin** el pase automático de admin: el usuario tiene que
 * tener alguno de los roles listados. Se usa en los portales (club, piloto),
 * donde no alcanza con ser admin para entrar al panel de otro.
 */
export const StrictRoles = (...roles: readonly Role[]) => SetMetadata(STRICT_ROLES_KEY, roles);
