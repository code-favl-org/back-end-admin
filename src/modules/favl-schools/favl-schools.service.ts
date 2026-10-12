import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavlSchoolDto } from './dto/favl-school.dto';
import { FavlSchool } from './entities/favl-school.entity';

@Injectable()
export class FavlSchoolsService {
  constructor(
    @InjectRepository(FavlSchool)
    private readonly repository: Repository<FavlSchool>,
  ) {}

  listar(): Promise<FavlSchool[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  async obtener(id: number): Promise<FavlSchool> {
    const school = await this.repository.findOne({ where: { id } });
    if (!school) throw new NotFoundException('No se encontró el registro.');
    return school;
  }

  async crear(input: FavlSchoolDto): Promise<void> {
    const school = this.repository.create({
      ...input,
      active: '1',
    });
    await this.repository.save(school);
  }

  async actualizar(id: number, input: FavlSchoolDto): Promise<void> {
    const school = await this.obtener(id);
    Object.assign(school, input);
    await this.repository.save(school);
  }

  async cambiarEstado(id: number, active: boolean): Promise<void> {
    const school = await this.obtener(id);
    school.active = active ? '1' : '0';
    await this.repository.save(school);
  }
}
