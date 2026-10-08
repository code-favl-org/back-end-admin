import { Role, type Role as RoleValue } from '../types/role';

/** Devuelve si los roles del usuario satisfacen los requeridos por una ruta o enlace. */
export function canAccess(userRoles: readonly RoleValue[], required?: readonly RoleValue[]): boolean {
  if (!required || required.length === 0) return true;
  if (userRoles.includes(Role.admin)) return true;
  return required.some((role) => userRoles.includes(role));
}
