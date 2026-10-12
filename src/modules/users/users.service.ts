import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { In, Not, QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isRole, ROLE_LABELS, Role } from '../../common/types/role';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

const PASSWORD_MIN_LENGTH = 8;

export interface UserFormData {
  usuario: string;
  email: string;
  role: Role;
  password?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  roles(): Array<{ value: Role; label: string }> {
    return Object.values(Role)
      // .filter((role) => role !== Role.club && role !== Role.piloto)
      .map((role) => ({
        value: role,
        label: ROLE_LABELS[role],
      }));
  }

  async listar(): Promise<User[]> {
    return this.users.find({
      where: { role: Not(In([Role.club, Role.piloto])) },
      order: { activo: 'DESC', usuario: 'ASC' },
    });
  }

  async obtener(id: number): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user || user.role === Role.club || user.role === Role.piloto) {
      throw new NotFoundException('No se encontró el usuario administrable desde esta pantalla.');
    }
    return user;
  }

  async crear(input: Record<string, unknown>): Promise<void> {
    const data = this.validar(input, true);
    const user = this.users.create({
      usuario: data.usuario,
      email: data.email,
      role: data.role,
      passwordHash: await hash(data.password!, 12),
      activo: true,
    });

    try {
      await this.users.manager.transaction(async (manager) => {
        const savedUser = await manager.getRepository(User).save(user);
        await manager.getRepository(UserProfile).save({ userId: savedUser.id });
      });
    } catch (error) {
      if (this.esUsuarioDuplicado(error)) {
        throw new ConflictException('Ese nombre de usuario o email ya está registrado.');
      }
      throw error;
    }
  }

  async actualizar(id: number, input: Record<string, unknown>): Promise<void> {
    const user = await this.obtener(id);
    const data = this.validar(input, false);
    user.usuario = data.usuario;
    user.email = data.email;
    user.role = data.role;
    if (data.password) user.passwordHash = await hash(data.password, 12);

    await this.save(user);
  }

  /** Baja lógica: conserva el registro y deshabilita el inicio de sesión. */
  async desactivar(id: number): Promise<void> {
    const user = await this.obtener(id);
    user.activo = false;
    await this.users.save(user);
  }

  /** Permite recuperar una cuenta dada de baja sin volver a crearla. */
  async activar(id: number): Promise<void> {
    const user = await this.obtener(id);
    user.activo = true;
    await this.users.save(user);
  }

  private validar(input: Record<string, unknown>, requierePassword: true): UserFormData & { password: string };
  private validar(input: Record<string, unknown>, requierePassword: false): UserFormData;
  private validar(
    input: Record<string, unknown>,
    requierePassword: boolean,
  ): UserFormData {
    const usuario = this.texto(input.usuario, 'El nombre de usuario es obligatorio.').trim();
    const email = this.texto(input.email, 'El email es obligatorio.').trim().toLowerCase();
    const roleValue = this.texto(input.role, 'Seleccioná un rol válido.').trim();
    const password = typeof input.password === 'string' ? input.password : '';
    const confirmarPassword = typeof input.confirmarPassword === 'string' ? input.confirmarPassword : '';

    if (!usuario || usuario.length > 50) {
      throw new BadRequestException('El nombre de usuario debe tener entre 1 y 50 caracteres.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      throw new BadRequestException('Ingresá un email válido (máximo 254 caracteres).');
    }
    if (!isRole(roleValue)) {
      throw new BadRequestException('El rol seleccionado no es válido para el backoffice.');
    }
    if (roleValue === Role.club || roleValue === Role.piloto) {
      throw new BadRequestException('Los usuarios de clubes y pilotos se crean desde sus respectivos formularios.');
    }
    const role = Role[roleValue];
    if ((requierePassword || password.length > 0) && password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
    }
    if ((requierePassword || password.length > 0) && password !== confirmarPassword) {
      throw new BadRequestException('La contraseña y su confirmación no coinciden.');
    }
    if (!requierePassword && password.length === 0 && confirmarPassword.length > 0) {
      throw new BadRequestException('Ingresá una contraseña para confirmar el cambio.');
    }

    return { usuario, email, role, ...(password ? { password } : {}) };
  }

  private texto(value: unknown, message: string): string {
    if (typeof value !== 'string') throw new BadRequestException(message);
    return value;
  }

  private async save(user: User): Promise<void> {
    try {
      await this.users.save(user);
    } catch (error) {
      if (this.esUsuarioDuplicado(error)) {
        throw new ConflictException('Ese nombre de usuario o email ya está registrado.');
      }
      throw error;
    }
  }

  private esUsuarioDuplicado(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError: unknown = error.driverError;
    if (typeof driverError !== 'object' || driverError === null || !('code' in driverError)) return false;
    return driverError.code === 'ER_DUP_ENTRY';
  }
}
