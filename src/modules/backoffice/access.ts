import { Role } from '@common/types';

/**
 * MATRIZ DE ACCESO del backoffice: qué roles entran a cada sección.
 * Admin entra siempre, por eso no se lista.
 *
 * Es la única fuente de verdad: los controladores la usan en @Roles(...)
 * y el menú la usa para ocultar lo que el usuario no puede abrir.
 */
export const ACCESS = {
  web: [Role.Comunicacion],               // Gestión WEB: inicio, noticias, banners, páginas
  socios: [Role.Secretaria],              // Padrón de socios
  cuotas: [Role.Secretaria, Role.Tesoreria],
  clubes: [Role.Secretaria],
} as const satisfies Record<string, readonly Role[]>;

/**
 * Página a la que cae cada rol al ingresar (si no venía pidiendo otra ruta).
 * Apunta a la primera sección que ese rol puede abrir; Admin va al panel.
 * Si se agrega un rol nuevo, TypeScript obliga a completarlo acá.
 */
export const LANDING: Record<Role, string> = {
  [Role.Admin]: '/admin/panel',
  [Role.Secretaria]: '/admin/socios',
  [Role.Tesoreria]: '/admin/socios/cuotas',
  [Role.Comunicacion]: '/admin/web/noticias',
};

/**
 * Página de inicio de un usuario según sus roles. Con varios roles gana el
 * primero en el orden del enum `Role` (Admin, Secretaría, Tesorería, Comunicación).
 * Sin ningún rol conocido, cae al panel (que no exige rol).
 */
export function landingFor(roles: readonly Role[]): string {
  const role = Object.values(Role).find((r) => roles.includes(r));
  return role ? LANDING[role] : LANDING[Role.Admin];
}
