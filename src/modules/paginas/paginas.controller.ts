import { Controller, Get, Render } from '@nestjs/common';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';
import { PaginasService } from './paginas.service';

/** Páginas estáticas del sitio (/admin/web/paginas). Rol: Comunicación (y Admin). */
@Controller('admin/web/paginas')
export class PaginasController {
  constructor(private readonly paginas: PaginasService) {}

  @Roles(Role.editor)
  @Get()
  @Render('paginas/views/index')
  async listado() {
    return { paginas: await this.paginas.listar() };
  }
}
