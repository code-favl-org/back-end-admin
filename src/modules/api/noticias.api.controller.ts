import { Controller, Get } from '@nestjs/common';
import { Public } from '@common/decorators';
import { NoticiasService } from '../domain/contenido/noticias.service';

/** GET /api/noticias — noticias publicadas, de la más nueva a la más vieja. */
@Public()
@Controller('api/noticias')
export class NoticiasApiController {
  constructor(private readonly noticias: NoticiasService) {}

  @Get()
  listar() {
    return this.noticias.listarPublicadas();
  }
}
