import { Controller, Get } from '@nestjs/common';
import { Public } from '@common/decorators';
import { StatsService } from '../domain/contenido/stats.service';

/** GET /api/home/stats — cifras institucionales de la portada. */
@Public()
@Controller('api/home')
export class HomeApiController {
  constructor(private readonly stats: StatsService) {}

  @Get('stats')
  obtener() {
    return this.stats.obtener();
  }
}
