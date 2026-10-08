import type { NextFunction, Request, Response } from 'express';
import { ROLE_LABELS } from '../types';
import type { Role } from '../types/role';

const MENU_TEMPLATE_BY_ROLE: Record<Role, string> = {
  admin: 'partials/menus/menuAdmin.njk',
  piloto: 'partials/menus/menuPiloto.njk',
  cd: 'partials/menus/menuCd.njk',
  editor: 'partials/menus/menuEditor.njk',
  tesorero: 'partials/menus/menuTesorero.njk',
  club: 'partials/menus/menuClub.njk',
};

/** ¿La URL pertenece al backoffice (/admin, /admin/...)? */
export function isBackofficePath(url: string): boolean {
  return /^\/admin(\/|\?|$)/.test(url);
}

/**
 * Variables disponibles en TODAS las vistas del backoffice.
 * Corre después de SessionMiddleware (así ya existe req.user) y selecciona la
 * plantilla del menú según el rol.
 *
 * Variables que deja en `res.locals`:
 *  - currentPath: ruta actual sin query ni barra final
 *  - year:        año actual (footer)
 *  - menuTemplate: plantilla Nunjucks del menú del rol
 *  - isMenuActive: comprueba si una ruta está activa
 *  - roleLabel:   roles del usuario en texto ("Secretaría, Tesorería")
 */
export function backofficeLocals(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl.split('?')[0].replace(/\/+$/, '') || '/';
  res.locals.currentPath = path;
  res.locals.year = new Date().getFullYear();
  const role = req.user?.roles[0];
  res.locals.menuTemplate = role ? MENU_TEMPLATE_BY_ROLE[role] : undefined;
  res.locals.isMenuActive = (href: string, includeDescendants = false) =>
    path === href || (includeDescendants && path.startsWith(`${href}/`));
  res.locals.roleLabel = req.user?.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ') ?? '';
  next();
}
