import type { Role } from './role';

/** Usuario autenticado tal como viaja en `req.user` (nunca incluye el hash). */
export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  roles: Role[];
}
