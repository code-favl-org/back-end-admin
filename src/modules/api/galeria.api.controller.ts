import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '@common/decorators';
import { GaleriaService } from '../domain/contenido/galeria.service';

/** GET /api/galeria?categoria=parapente&limit=8 — muestra al azar de fotos. */
@Public()
@Controller('api/galeria')
export class GaleriaApiController {
  constructor(private readonly galeria: GaleriaService) {}

  @Get()
  listar(@Query('categoria') categoria?: string, @Query('limit') limit?: string) {
    return this.galeria.listar({ categoria, limit: limit ? Number(limit) : undefined });
  }
}
