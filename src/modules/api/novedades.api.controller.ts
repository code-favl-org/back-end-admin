import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '@common/decorators';
import { EventosService } from '../domain/contenido/eventos.service';

/** /api/novedades/eventos — eventos y competencias del sitio. */
@Public()
@Controller('api/novedades/eventos')
export class NovedadesApiController {
  constructor(private readonly eventos: EventosService) {}

  /** GET ?modalidad=parapente&estado=inscripciones-abiertas (ambos opcionales). */
  @Get()
  listar(@Query('modalidad') modalidad?: string, @Query('estado') estado?: string) {
    return this.eventos.listar({ modalidad, estado });
  }

  /** GET /:slug — 404 si no existe. */
  @Get(':slug')
  obtener(@Param('slug') slug: string) {
    return this.eventos.obtenerPorSlug(slug);
  }
}
