import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppConfig, InjectConfig } from '@common/config';
import { HashingService } from '@common/hashing';
import { AuthUser, Role } from '@common/types';

export interface UserRecord extends AuthUser {
  passwordHash: string;
  activo: boolean;
}

/**
 * Usuarios del backoffice.
 *
 * TODO: reemplazar el array en memoria por la tabla de usuarios.
 * Mientras tanto siembra un usuario por rol (solo si hay `seedPassword`).
 */
@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly users: UserRecord[] = [];

  constructor(
    @InjectConfig() private readonly config: AppConfig,
    private readonly hashing: HashingService,
  ) {}

  /** Al iniciar el módulo siembra los usuarios de ejemplo (uno por rol). */
  async onModuleInit() {
    const password = this.config.auth.seedPassword;
    if (!password) return;

    const passwordHash = await this.hashing.hash(password);
    const seed: Array<[string, string, Role]> = [
      ['Administrador', 'admin@favl.local', Role.Admin],
      ['Secretaría', 'secretaria@favl.local', Role.Secretaria],
      ['Tesorería', 'tesoreria@favl.local', Role.Tesoreria],
      ['Comunicación', 'comunicacion@favl.local', Role.Comunicacion],
    ];
    seed.forEach(([nombre, email, role], i) =>
      this.users.push({ id: String(i + 1), nombre, email, roles: [role], passwordHash, activo: true }),
    );
    this.logger.warn(`Usuarios de ejemplo cargados: ${seed.map((s) => s[1]).join(', ')}`);
  }

  /** Busca un usuario ACTIVO por id (lo usa el middleware de sesión en cada request). */
  async findById(id: string): Promise<UserRecord | undefined> {
    return this.users.find((u) => u.id === id && u.activo);
  }

  /** Busca un usuario ACTIVO por email, sin distinguir mayúsculas ni espacios en los bordes. */
  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const needle = email.trim().toLowerCase();
    return this.users.find((u) => u.email === needle && u.activo);
  }

  /** Usuarios activos, para la pantalla del login de desarrollo (solo `AuthUser`, sin hash). */
  async listActive(): Promise<AuthUser[]> {
    return this.users.filter((u) => u.activo).map((u) => this.toAuthUser(u));
  }

  /** Quita el hash antes de que el usuario viaje en `req.user`. */
  toAuthUser(u: UserRecord): AuthUser {
    return { id: u.id, nombre: u.nombre, email: u.email, roles: [...u.roles] };
  }
}
