import { Controller, Get, Render } from '@nestjs/common';
import { Roles } from '@common/decorators';
import { ACCESS } from '../access';

/**
 * Clubes (/admin/clubes). Rol: Secretaría (y Admin).
 * TODO: las vistas son estáticas; conectar con ClubesService cuando exista el CRUD.
 */
@Roles(...ACCESS.clubes)
@Controller('admin/clubes')
export class ClubesController {
  @Get()
  @Render('backoffice/clubes/views/listado')
  listado() {
    return {};
  }

  @Get('nuevo')
  @Render('backoffice/clubes/views/nuevo')
  nuevo() {
    return {};
  }
}
