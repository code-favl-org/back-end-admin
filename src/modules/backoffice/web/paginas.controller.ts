import { Controller, Get, Render } from '@nestjs/common';
import { Roles } from '@common/decorators';
import { ACCESS } from '../access';
import { PaginasService } from '../../domain/contenido/paginas.service';

/** Páginas estáticas del sitio (/admin/web/paginas). Rol: Comunicación (y Admin). */
@Roles(...ACCESS.web)
@Controller('admin/web/paginas')
export class PaginasController {
  constructor(private readonly paginas: PaginasService) {}

  @Get()
  @Render('backoffice/web/views/paginas/index')
  async listado() {
    return { paginas: await this.paginas.listar() };
  }
}
