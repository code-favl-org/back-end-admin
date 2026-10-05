/**
 * Roles del backoffice. Es la ÚNICA fuente de verdad: guards, menú y
 * controladores usan este enum (nunca strings sueltos).
 *
 * `Admin` es superusuario: pasa todos los chequeos de rol.
 */
export enum Role {
  Admin = 'admin',
  Secretaria = 'secretaria',
  Tesoreria = 'tesoreria',
  Comunicacion = 'comunicacion',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.Admin]: 'Administrador',
  [Role.Secretaria]: 'Secretaría',
  [Role.Tesoreria]: 'Tesorería',
  [Role.Comunicacion]: 'Comunicación',
};

/**
 * ¿Puede acceder alguien con `userRoles` a algo que exige `required`?
 * - Sin roles requeridos  -> basta con estar autenticado.
 * - Admin                 -> siempre.
 * - Cualquier otro        -> debe tener AL MENOS UNO de los requeridos.
 */
export function canAccess(userRoles: readonly Role[], required?: readonly Role[]): boolean {
  if (!required || required.length === 0) return true;
  if (userRoles.includes(Role.Admin)) return true;
  return required.some((r) => userRoles.includes(r));
}
