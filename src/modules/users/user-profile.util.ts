import { EntityManager, QueryFailedError } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';

/** Código de MariaDB: la fila referenciada (`users.id`) no existe. */
const CLAVE_AJENA_INEXISTENTE = 'ER_NO_REFERENCED_ROW_2';

/**
 * Perfil personal del usuario, creándolo vacío si todavía no existe.
 *
 * Las cuentas creadas antes de `user_profiles` (y las que se crean por fuera de los formularios)
 * no tienen fila: se crea acá, al primer acceso, en vez de responder un error. Si el usuario
 * referenciado no existe —datos huérfanos de pruebas— devuelve un perfil vacío sin guardarlo.
 */
export async function ensureUserProfile(
  manager: EntityManager,
  userId: number,
): Promise<UserProfile> {
  const profiles = manager.getRepository(UserProfile);
  const existing = await profiles.findOne({ where: { userId } });
  if (existing) return existing;

  try {
    return await profiles.save(profiles.create({ userId }));
  } catch (error) {
    if (usuarioInexistente(error)) return profiles.create({ userId });
    throw error;
  }
}

function usuarioInexistente(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError: unknown = error.driverError;
  if (typeof driverError !== 'object' || driverError === null || !('code' in driverError)) return false;
  return driverError.code === CLAVE_AJENA_INEXISTENTE;
}
