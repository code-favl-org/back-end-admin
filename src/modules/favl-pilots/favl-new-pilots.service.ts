import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { eliminarImagenSubida } from '../../common/upload/image-upload';
import { User } from '../users/entities/user.entity';
import { FavlPilotDto } from './dto/favl-pilot.dto';
import { FavlNewPilot } from './entities/favl-new-pilot.entity';
import { FavlPilot } from './entities/favl-pilot.entity';

/** Resultado del chequeo previo: qué dato ya existe, dónde y si está activo. */
export interface VerificacionSolicitud {
  /** `padron` = piloto ya dado de alta; `solicitud` = pedido pendiente. */
  documento?: { origen: 'padron' | 'solicitud'; activo: boolean };
  /** `cuenta` = usuario ya existente; `solicitud` = pedido pendiente. */
  email?: { origen: 'cuenta' | 'solicitud'; activo: boolean };
}

/** Deja solo letras y números, en mayúsculas, para comparar documentos tipeados distinto. */
function normalizarDocumento(document?: string): string {
  return (document ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();
}

/** Misma normalización que `normalizarDocumento`, del lado de SQL. */
function documentoNormalizado(alias: string): string {
  return `UPPER(REPLACE(REPLACE(REPLACE(${alias}.document, '.', ''), '-', ''), ' ', ''))`;
}

@Injectable()
export class FavlNewPilotsService {
  constructor(
    @InjectRepository(FavlNewPilot)
    private readonly repository: Repository<FavlNewPilot>,
    @InjectRepository(FavlPilot)
    private readonly pilots: Repository<FavlPilot>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  listar(): Promise<FavlNewPilot[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  /**
   * Chequeo en vivo del formulario: si el documento o el email ya están en la base.
   * No bloquea nada acá: el rechazo real lo hace `crear()`.
   */
  async verificar(
    document?: string,
    documentType?: string,
    email?: string,
  ): Promise<VerificacionSolicitud> {
    return this.buscarExistente(document, documentType, email);
  }

  /**
   * Busca el dato en el padrón, en las cuentas y en las solicitudes pendientes, para no
   * repetir un piloto ni una solicitud. Compara el documento por tipo + número, sin puntos,
   * guiones ni espacios, y sin distinguir mayúsculas.
   */
  private async buscarExistente(
    document?: string,
    documentType?: string,
    email?: string,
  ): Promise<VerificacionSolicitud> {
    const resultado: VerificacionSolicitud = {};

    const documento = normalizarDocumento(document);
    if (documento) {
      const encontrado = await this.buscarDocumento(documento, documentType);
      if (encontrado) resultado.documento = encontrado;
    }

    const correo = email?.trim().toLowerCase();
    if (correo) {
      const encontrado = await this.buscarEmail(correo);
      if (encontrado) resultado.email = encontrado;
    }

    return resultado;
  }

  private async buscarDocumento(
    documento: string,
    documentType?: string,
  ): Promise<VerificacionSolicitud['documento']> {
    const enPadron = this.pilots
      .createQueryBuilder('piloto')
      .select(['piloto.status'])
      .where(`${documentoNormalizado('piloto')} = :documento`, { documento });
    if (documentType) enPadron.andWhere('piloto.documentType = :documentType', { documentType });
    const pilot = await enPadron.getOne();
    if (pilot) return { origen: 'padron', activo: pilot.status !== '0' };

    const enSolicitud = this.repository
      .createQueryBuilder('solicitud')
      .select(['solicitud.status'])
      .where(`${documentoNormalizado('solicitud')} = :documento`, { documento });
    if (documentType) enSolicitud.andWhere('solicitud.documentType = :documentType', { documentType });
    const solicitud = await enSolicitud.getOne();
    if (solicitud) return { origen: 'solicitud', activo: solicitud.status !== '0' };

    return undefined;
  }

  private async buscarEmail(correo: string): Promise<VerificacionSolicitud['email']> {
    const cuenta = await this.users.findOne({ select: ['activo'], where: { email: correo } });
    if (cuenta) return { origen: 'cuenta', activo: cuenta.activo };

    const solicitud = await this.repository.findOne({
      select: ['status'],
      where: { email: correo },
    });
    if (solicitud) return { origen: 'solicitud', activo: solicitud.status !== '0' };

    return undefined;
  }

  async obtener(id: number): Promise<FavlNewPilot> {
    const pilot = await this.repository.findOne({ where: { id } });
    if (!pilot) throw new NotFoundException('No se encontró el registro.');
    return pilot;
  }

  async crear(input: FavlPilotDto, photo: string): Promise<void> {
    const existente = await this.buscarExistente(input.document, input.documentType, input.email);
    const motivos: string[] = [];
    if (existente.documento) {
      const { origen, activo } = existente.documento;
      if (origen === 'solicitud') {
        motivos.push('ya hay una solicitud pendiente con ese documento');
      } else {
        motivos.push(
          activo
            ? 'ya hay un piloto con ese documento'
            : 'ya hay un piloto con ese documento (dado de baja)',
        );
      }
    }
    if (existente.email) {
      const { origen, activo } = existente.email;
      if (origen === 'solicitud') {
        motivos.push('ya hay una solicitud pendiente con ese email');
      } else {
        motivos.push(
          activo ? 'ese email ya tiene una cuenta' : 'ese email ya tiene una cuenta (inactiva)',
        );
      }
    }
    if (motivos.length > 0) {
      throw new ConflictException(
        `No se cargó la solicitud: ${motivos.join(' y ')}. Verificá los datos.`,
      );
    }

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
