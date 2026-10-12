import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { eliminarImagenSubida } from '../../common/upload/image-upload';
import { AppConfig, InjectConfig } from '../../config';
import { Role } from '../../common/types/role';
import { createLinkedUser, updateLinkedUserEmail } from '../users/create-linked-user';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { ensureUserProfile } from '../users/user-profile.util';
import { FavlPilotDto } from './dto/favl-pilot.dto';
import { FavlPilot } from './entities/favl-pilot.entity';

type FavlPilotProfileFields = Pick<
  UserProfile,
  | 'firstName'
  | 'lastName'
  | 'photo'
  | 'address'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'country'
  | 'birthDate'
  | 'phone'
  | 'mobilePhone'
  | 'gender'
>;
type FavlPilotWithAccessEmail = FavlPilot & FavlPilotProfileFields & { email: string };

/** Campos personales que viven en `user_profiles` y no en `favl_pilots`. */
const PROFILE_FIELDS: Array<keyof FavlPilotProfileFields> = [
  'firstName',
  'lastName',
  'photo',
  'address',
  'city',
  'state',
  'postalCode',
  'country',
  'birthDate',
  'phone',
  'mobilePhone',
  'gender',
];

@Injectable()
export class FavlPilotsService {
  constructor(
    @InjectRepository(FavlPilot)
    private readonly repository: Repository<FavlPilot>,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  /**
   * Padrón completo: cada piloto con los datos personales de su perfil.
   * Los pilotos sin fila en `user_profiles` se listan con los datos personales vacíos.
   */
  async listar(): Promise<Array<FavlPilot & FavlPilotProfileFields>> {
    const pilots = await this.repository.find({ order: { id: 'ASC' } });
    if (pilots.length === 0) return [];

    const profiles = await this.repository.manager.getRepository(UserProfile).findBy({
      userId: In(pilots.map(({ userId }) => userId)),
    });
    const profilesByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));
    return pilots.map((pilot) => this.conPerfil(pilot, profilesByUserId.get(pilot.userId)));
  }

  async obtener(id: number): Promise<FavlPilotWithAccessEmail> {
    const pilot = await this.repository.findOne({ where: { id } });
    if (!pilot) throw new NotFoundException('No se encontró el registro.');
    const user = await this.repository.manager.getRepository(User).findOne({
      select: ['id', 'email'],
      where: { id: pilot.userId },
    });
    if (!user?.email) throw new NotFoundException('No se encontró el email de acceso del piloto.');
    const profile = await ensureUserProfile(this.repository.manager, pilot.userId);
    return Object.assign(this.conPerfil(pilot, profile), { email: user.email });
  }

  async obtenerDeUsuario(userId: number): Promise<FavlPilotWithAccessEmail> {
    const pilot = await this.repository.findOne({ where: { userId } });
    if (!pilot) throw new NotFoundException('No se encontró el perfil del piloto.');
    return this.obtener(pilot.id);
  }

  async actualizarPerfilUsuario(
    userId: number,
    input: FavlPilotDto,
    photo?: string,
  ): Promise<void> {
    const pilot = await this.repository.findOne({ where: { userId } });
    if (!pilot) throw new NotFoundException('No se encontró el perfil del piloto.');
    const profile = { ...input };
    delete profile.termsAndConditionsAccepted;
    await this.actualizar(pilot.id, profile, photo);
  }

  async crear(input: FavlPilotDto, photo: string): Promise<void> {
    this.validarEmailAcceso(input.email);
    const { email, ...fields } = input;
    const profileFields = this.perfilFields(fields);
    const pilotFields = this.pilotFields(fields);
    const pilot = this.repository.create({ ...pilotFields, status: '1' });
    await this.repository.manager.transaction(async (manager) => {
      const pilots = manager.getRepository(FavlPilot);
      const user = await createLinkedUser(manager, {
        role: Role.piloto,
        usernamePrefix: 'piloto',
        email: email!,
        storePlaintextPassword: this.config.env === 'development',
      });
      pilot.userId = user.id;
      const profile = await ensureUserProfile(manager, user.id);
      Object.assign(profile, profileFields, { photo });
      await manager.getRepository(UserProfile).save(profile);
      await pilots.save(pilot);
    });
  }

  async actualizar(id: number, input: FavlPilotDto, photo?: string): Promise<void> {
    this.validarEmailAcceso(input.email);
    const pilot = await this.obtener(id);
    const fields = { ...input };
    delete fields.email;
    Object.assign(pilot, this.pilotFields(fields));
    let previousPhoto: string | null = null;
    await this.repository.manager.transaction(async (manager) => {
      await updateLinkedUserEmail(manager, pilot.userId, input.email!);
      const profile = await ensureUserProfile(manager, pilot.userId);
      previousPhoto = profile.photo;
      Object.assign(profile, this.perfilFields(fields));
      if (photo) profile.photo = photo;
      await manager.getRepository(UserProfile).save(profile);
      await manager.getRepository(FavlPilot).save(pilot);
    });
    if (photo) eliminarImagenSubida(previousPhoto);
  }

  async cambiarEstado(id: number, active: boolean): Promise<void> {
    const pilot = await this.obtener(id);
    pilot.status = active ? '1' : '0';
    await this.repository.save(pilot);
  }

  private validarEmailAcceso(email: string | null | undefined): void {
    if (!email?.trim()) {
      throw new BadRequestException('El email es obligatorio para iniciar sesión.');
    }
  }

  /**
   * Copia al piloto solo los campos personales del perfil.
   * Se listan uno por uno para no arrastrar `userId`, `createdAt` ni `updatedAt`, que son del perfil.
   */
  private conPerfil(pilot: FavlPilot, profile?: UserProfile): FavlPilot & FavlPilotProfileFields {
    const destino = pilot as FavlPilot & FavlPilotProfileFields;
    for (const field of PROFILE_FIELDS) {
      destino[field] = profile?.[field] ?? null;
    }
    return destino;
  }

  private perfilFields(input: Partial<FavlPilotDto>): Partial<UserProfile> {
    return {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.mobilePhone !== undefined ? { mobilePhone: input.mobilePhone } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
    };
  }

  private pilotFields(input: Partial<FavlPilotDto>): Partial<FavlPilot> {
    const fields = { ...input };
    for (const field of PROFILE_FIELDS) delete fields[field];
    delete fields.email;
    return fields;
  }
}
