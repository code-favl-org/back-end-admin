import type { AuthUser } from '@common/types';
import { landingFor } from '../access';
import { isBackofficePath } from '../shared/backoffice.locals';

/**
 * Valida a dónde se puede volver después de ingresar. Solo se acepta una ruta
 * interna del backoffice. Se normaliza la URL antes de validar, así
 * "/admin/../x", "//evil.com" o "https://evil.com" se rechazan.
 *
 * @param next Ruta pedida (query `?next=` o campo oculto del formulario).
 * @returns La ruta (con su query) si es segura; `undefined` si no hay o no sirve.
 */
export function safeNext(next?: string): string | undefined {
  if (typeof next !== 'string' || !next.startsWith('/admin') || next.includes('\\')) return undefined;
  try {
    const url = new URL(next, 'http://local');
    const internal = url.origin === 'http://local' && isBackofficePath(url.pathname);
    // /admin/login se descarta: con sesión iniciada redirigiría a sí mismo en bucle.
    return internal && url.pathname !== '/admin/login' ? url.pathname + url.search : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Destino tras ingresar: la ruta que el usuario pedía (`next`, si es válida) o,
 * si no pedía ninguna (ej.: entró desde el enlace "Ingresar" del sitio público),
 * la página de inicio de su rol (ver `landingFor`).
 */
export function redirectAfterLogin(next: string | undefined, user: AuthUser): string {
  return safeNext(next) ?? landingFor(user.roles);
}
