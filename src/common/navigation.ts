import { isRole, Role } from './types/role';

/** Ruta del panel de inicio: `/admin` redirige acá. */
export const PANEL_PATH = '/admin/panel';

/** Vista del panel: un marco común que incluye el parcial del rol. */
export const PANEL_VIEW = 'panel/views/index';

/** Título y parcial de contenido según el rol (los `include` llevan `.njk`). */
const PANEL_BY_ROLE: Record<Role, { titulo: string; partial: string }> = {
  [Role.admin]: { titulo: 'Panel de control', partial: 'panel/views/partials/panelAdmin.njk' },
  [Role.cd]: { titulo: 'Panel de comisión directiva', partial: 'panel/views/partials/panelCd.njk' },
  [Role.tesorero]: { titulo: 'Panel de tesorería', partial: 'panel/views/partials/panelTesorero.njk' },
  [Role.editor]: { titulo: 'Panel de comunicación', partial: 'panel/views/partials/panelEditor.njk' },
  [Role.club]: { titulo: 'Panel del club', partial: 'panel/views/partials/panelClub.njk' },
  [Role.piloto]: { titulo: 'Panel del piloto', partial: 'panel/views/partials/panelPiloto.njk' },
};

/** Primera rol conocida del usuario; si no hay ninguna, se asume admin. */
function primaryRole(roles?: readonly string[]): Role {
  return roles?.find(isRole) ?? Role.admin;
}

/** Locals que consume `panel/views/index`: título y parcial del rol del usuario. */
export function panelLocals(roles?: readonly string[]): { panelTitle: string; panelTemplate: string } {
  const { titulo, partial } = PANEL_BY_ROLE[primaryRole(roles)];
  return { panelTitle: titulo, panelTemplate: partial };
}
