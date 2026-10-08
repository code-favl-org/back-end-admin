import type { Role } from './role';

/** Usuario autenticado tal como viaja en `req.user` (viene de los claims del JWT; nunca incluye el hash). */
export interface AuthUser {
  id: number;
  usuario: string;
  /** Texto para mostrar en las vistas (hoy, el nombre de usuario). */
  nombre: string;
  email: string;
  roles: Role[];
}
