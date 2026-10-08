import { SetMetadata } from '@nestjs/common';
import type { Role } from '../types/role';

export const ROLES_KEY = 'roles';

/**
 * Restringe una ruta (o todo un controlador) a ciertos roles. Admin siempre pasa.
 * A nivel método pisa lo definido a nivel clase.
 * Sin @Roles basta con estar autenticado.
 */
export const Roles = (...roles: readonly Role[]) => SetMetadata(ROLES_KEY, roles);
