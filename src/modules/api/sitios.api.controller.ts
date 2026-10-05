import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '@common/decorators';
import { SitiosService } from '../domain/clubes/sitios.service';

/** GET /api/sitios?modalidad=parapente&tipo=club — puntos del mapa (ambos filtros opcionales). */
@Public()
@Controller('api/sitios')
export class SitiosApiController {
  constructor(private readonly sitios: SitiosService) {}

  @Get()
  listar(@Query('modalidad') modalidad?: string, @Query('tipo') tipo?: string) {
    return this.sitios.listar({ modalidad, tipo });
  }
}
