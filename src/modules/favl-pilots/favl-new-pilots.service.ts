import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { eliminarImagenSubida } from '../../common/upload/image-upload';
import { FavlPilotDto } from './dto/favl-pilot.dto';
import { FavlNewPilot } from './entities/favl-new-pilot.entity';

@Injectable()
export class FavlNewPilotsService {
  constructor(
    @InjectRepository(FavlNewPilot)
    private readonly repository: Repository<FavlNewPilot>,
  ) {}

  listar(): Promise<FavlNewPilot[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  async obtener(id: number): Promise<FavlNewPilot> {
    const pilot = await this.repository.findOne({ where: { id } });
    if (!pilot) throw new NotFoundException('No se encontró el registro.');
    return pilot;
  }

  async crear(input: FavlPilotDto, photo: string): Promise<void> {
    const pilot = this.repository.create({
      ...input,
      photo,
      status: '1',
    });
    await this.repository.save(pilot);
  }

  async actualizar(id: number, input: FavlPilotDto, photo?: string): Promise<void> {
    const pilot = await this.obtener(id);
    const fields = { ...input };
    delete fields.photo;
    Object.assign(pilot, fields);
    const previousPhoto = pilot.photo;
    if (photo) pilot.photo = photo;
    await this.repository.save(pilot);
    if (photo) eliminarImagenSubida(previousPhoto);
  }

  async cambiarEstado(id: number, active: boolean): Promise<void> {
    const pilot = await this.obtener(id);
    pilot.status = active ? '1' : '0';
    await this.repository.save(pilot);
  }
}
