import type { NextFunction, Request, Response } from 'express';
import { ROLE_LABELS } from '@common/types';
import { buildMenu } from '../menu';

/** ¿La URL pertenece al backoffice (/admin, /admin/...)? */
export function isBackofficePath(url: string): boolean {
  return /^\/admin(\/|\?|$)/.test(url);
}

/**
 * Variables disponibles en TODAS las vistas del backoffice.
 * Corre después de SessionMiddleware (así ya existe req.user) y filtra el
 * menú según los roles del usuario.
 *
 * Variables que deja en `res.locals`:
 *  - currentPath: ruta actual sin query ni barra final
 *  - year:        año actual (footer)
 *  - menu:        menú lateral ya filtrado por rol, con el ítem activo marcado
 *  - roleLabel:   roles del usuario en texto ("Secretaría, Tesorería")
 */
export function backofficeLocals(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl.split('?')[0].replace(/\/+$/, '') || '/';
  res.locals.currentPath = path;
  res.locals.year = new Date().getFullYear();
  res.locals.menu = buildMenu(path, req.user);
  res.locals.roleLabel = req.user?.roles.map((r) => ROLE_LABELS[r]).join(', ') ?? '';
  next();
}
