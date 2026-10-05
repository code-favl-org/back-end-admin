import { AuthUser, canAccess, Role } from '@common/types';
import { ACCESS } from './access';

/** Un elemento del menú lateral: enlace, grupo con `children`, o separador con `header`. */
export interface MenuItem {
  /** Texto visible. */
  label?: string;
  /** Clase de Bootstrap Icons (ej.: `bi-people-fill`). */
  icon?: string;
  /** Destino del enlace. Los grupos no lo llevan. */
  href?: string;
  /** Título de separador (ej.: "SISTEMA"); no es un enlace. */
  header?: string;
  /** Subítems. Un grupo sin subítems visibles para el usuario se oculta entero. */
  children?: MenuItem[];
  /** Roles que lo ven (Admin siempre). Sin `roles`: lo ve cualquier usuario autenticado. */
  roles?: readonly Role[];
  /** Lo calcula buildMenu: es la página actual. */
  active?: boolean;
  /** Lo calcula buildMenu: el grupo se muestra desplegado. */
  open?: boolean;
}

/** Menú lateral del backoffice. Un solo lugar para agregar/quitar secciones. */
export const MENU: MenuItem[] = [
  {
    label: 'Gestión WEB',
    icon: 'bi-globe2',
    children: [
      { label: 'Inicio', href: '/admin/web/inicio', roles: ACCESS.web },
      { label: 'Noticias', href: '/admin/web/noticias', roles: ACCESS.web },
      { label: 'Banners', href: '/admin/web/banners', roles: ACCESS.web },
      { label: 'Páginas', href: '/admin/web/paginas', roles: ACCESS.web },
    ],
  },
  {
    label: 'Socios',
    icon: 'bi-people-fill',
    children: [
      { label: 'Listado', href: '/admin/socios', roles: ACCESS.socios },
      { label: 'Nuevo socio', href: '/admin/socios/nuevo', roles: ACCESS.socios },
      { label: 'Cuotas', href: '/admin/socios/cuotas', roles: ACCESS.cuotas },
    ],
  },
  {
    label: 'Clubes',
    icon: 'bi-building',
    children: [
      { label: 'Listado', href: '/admin/clubes', roles: ACCESS.clubes },
      { label: 'Nuevo club', href: '/admin/clubes/nuevo', roles: ACCESS.clubes },
    ],
  },
  // Descomentar cuando existan sus módulos/vistas:
  // { label: 'Eventos', icon: 'bi-calendar-event', children: [
  //   { label: 'Listado', href: '/admin/eventos' },
  //   { label: 'Calendario', href: '/admin/eventos/calendario' },
  // ]},
  // { header: 'SISTEMA' },
  // { label: 'Reportes', icon: 'bi-graph-up', href: '/admin/reportes' },
  // { label: 'Configuración', icon: 'bi-gear-fill', href: '/admin/configuracion' },
];

/**
 * Devuelve el menú que ve `user` (sin lo que no puede abrir), marcando el
 * ítem activo según la URL actual. Gana el href más largo que coincida, así
 * /admin/socios/nuevo no deja también activo a /admin/socios.
 *
 * @param path Ruta actual sin query (ej.: `/admin/socios/nuevo`).
 * @param user Usuario autenticado; sin usuario no se muestra ningún ítem.
 */
export function buildMenu(path: string, user?: AuthUser): MenuItem[] {
  const allowed = (i: MenuItem) => !!user && canAccess(user.roles, i.roles);

  const visible = MENU.map((item) =>
    item.children ? { ...item, children: item.children.filter(allowed) } : item,
  ).filter((item) => (item.children ? item.children.length > 0 : allowed(item)));

  const leaves = visible.flatMap((i) => i.children ?? (i.href ? [i] : []));
  const best = leaves
    .filter((l) => l.href && (path === l.href || path.startsWith(l.href + '/')))
    .sort((a, b) => b.href!.length - a.href!.length)[0];

  return visible.map((item) => {
    if (!item.children) return { ...item, active: item === best };
    const children = item.children.map((c) => ({ ...c, active: c === best }));
    const open = children.some((c) => c.active);
    return { ...item, children, open, active: open };
  });
}
