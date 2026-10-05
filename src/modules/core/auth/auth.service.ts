import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { HashingService } from '@common/hashing';
import { AuthUser } from '@common/types';
import { UsersService } from '../users/users.service';

/** Verificación de credenciales (email + contraseña). La sesión la maneja SessionService. */
@Injectable()
export class AuthService {
  // Hash de relleno: si el email no existe igual se calcula un scrypt,
  // para que el tiempo de respuesta no delate qué emails están registrados.
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly hashing: HashingService,
  ) {
    this.dummyHash = this.hashing.hash(randomUUID());
  }

  /** Devuelve el usuario si las credenciales son correctas; si no, null. */
  async validateCredentials(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.users.findByEmail(email ?? '');
    const ok = await this.hashing.verify(password ?? '', user ? user.passwordHash : await this.dummyHash);
    return user && ok ? this.users.toAuthUser(user) : null;
  }
}
