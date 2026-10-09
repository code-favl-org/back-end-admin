import { Controller, Get, Render } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';
import { PaginasService } from './paginas.service';

/** Páginas estáticas del sitio (/admin/web/paginas). Rol: Comunicación (y Admin). */
@ApiTags('Web · Páginas')
@Controller('admin/web/paginas')
export class PaginasController {
  constructor(private readonly paginas: PaginasService) {}

  @Roles(Role.editor)
  @Get()
  @Render('paginas/views/index')
  @ApiOperation({ summary: 'Listado de páginas', description: 'HTML con las páginas estáticas. Rol: editor o admin.' })
  async listado() {
    return { paginas: await this.paginas.listar() };
  }
}
