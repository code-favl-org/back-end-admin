import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { eliminarImagenSubida } from '../../common/upload/image-upload';
import { AppConfig, InjectConfig } from '../../config';
import { Role } from '../../common/types/role';
import { createLinkedUser, updateLinkedUserEmail } from '../users/create-linked-user';
import { User } from '../users/entities/user.entity';
import { FavlClubDto } from './dto/favl-club.dto';
import { FavlClub } from './entities/favl-club.entity';

type FavlClubWithAccessEmail = FavlClub & { email: string };

@Injectable()
export class FavlClubsService {
  constructor(
    @InjectRepository(FavlClub)
    private readonly repository: Repository<FavlClub>,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  listar(): Promise<FavlClub[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  async nombres(): Promise<string[]> {
    const clubs = await this.repository.find({
      select: ['name'],
      order: { id: 'ASC' },
    });
    return clubs
      .map(({ name }) => name)
      .filter((name): name is string => name !== null);
  }

  async obtener(id: number): Promise<FavlClubWithAccessEmail> {
    const club = await this.repository.findOne({ where: { id } });
    if (!club) throw new NotFoundException('No se encontró el registro.');
    const user = await this.repository.manager.getRepository(User).findOne({
      select: ['id', 'email'],
      where: { id: club.userId },
    });
    if (!user?.email) throw new NotFoundException('No se encontró el email de acceso del club.');
    return Object.assign(club, { email: user.email });
  }

  async obtenerDeUsuario(userId: number): Promise<FavlClubWithAccessEmail> {
    const club = await this.repository.findOne({ where: { userId } });
    if (!club) throw new NotFoundException('No se encontró el perfil del club.');
    return this.obtener(club.id);
  }

  async actualizarPerfilUsuario(
    userId: number,
    input: FavlClubDto,
    logo?: string,
  ): Promise<void> {
    const club = await this.repository.findOne({ where: { userId } });
    if (!club) throw new NotFoundException('No se encontró el perfil del club.');
    await this.actualizar(club.id, input, logo);
  }

  async crear(input: FavlClubDto, logo?: string): Promise<void> {
    const fields = { ...input };
    delete fields.logo;
    delete fields.email;
    const club = this.repository.create({
      ...fields,
      ...(logo ? { logo } : {}),
      active: true,
    });
    await this.repository.manager.transaction(async (manager) => {
      const clubs = manager.getRepository(FavlClub);
      const user = await createLinkedUser(manager, {
        role: Role.club,
        usernamePrefix: 'club',
        email: input.email!,
        storePlaintextPassword: this.config.env === 'development',
      });
      club.userId = user.id;
      await clubs.save(club);
    });
  }

  async actualizar(id: number, input: FavlClubDto, logo?: string): Promise<void> {
    const club = await this.obtener(id);
    const fields = { ...input };
    delete fields.logo;
    delete fields.email;
    Object.assign(club, fields);
    const previousLogo = club.logo;
    if (logo) club.logo = logo;
    await this.repository.manager.transaction(async (manager) => {
      await updateLinkedUserEmail(manager, club.userId, input.email!);
      await manager.getRepository(FavlClub).save(club);
    });
    if (logo) eliminarImagenSubida(previousLogo);
  }

  async cambiarEstado(id: number, active: boolean): Promise<void> {
    const club = await this.obtener(id);
    club.active = active;
    await this.repository.save(club);
  }
}
