/** Valores de rol compartidos por la app, la base y los tokens. */
export const Role = {
  admin: 'admin',
  editor: 'editor',
  tesorero: 'tesorero',
  cd: 'cd',
  club: 'club',
  piloto: 'piloto',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LABELS: Record<Role, string> = {
  [Role.admin]: 'Administrador',
  [Role.editor]: 'Editor',
  [Role.tesorero]: 'Tesorero',
  [Role.cd]: 'Comisión directiva',
  [Role.club]: 'Club',
  [Role.piloto]: 'Piloto',
};

/** Comprueba si un texto coincide con una clave/valor del mapa de roles. */
export function isRole(value: string): value is Role {
  return Object.prototype.hasOwnProperty.call(Role, value);
}
