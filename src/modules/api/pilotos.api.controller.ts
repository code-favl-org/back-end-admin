import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { Public } from '@common/decorators';
import { PilotosService } from '../domain/socios/pilotos.service';

/** Mismo criterio que el frontend: dígitos separados por guiones (`30111222`, `07-00451`), hasta 32 caracteres. */
const IDENTIFICADOR = /^\d+(?:-\d+)*$/;

/** GET /api/verificarPiloto/:identificador — datos públicos de un piloto por DNI o licencia. */
@Public()
@Controller('api/verificarPiloto')
export class PilotosApiController {
  constructor(private readonly pilotos: PilotosService) {}

  /** 400 si el identificador no es válido; 404 si no hay un piloto con ese dato. */
  @Get(':identificador')
  verificar(@Param('identificador') identificador: string) {
    if (identificador.length > 32 || !IDENTIFICADOR.test(identificador)) {
      throw new BadRequestException('Ingresá un DNI o número de licencia válido.');
    }
    return this.pilotos.verificar(identificador);
  }
}
