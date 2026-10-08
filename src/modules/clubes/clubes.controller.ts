import { Controller, Get, Render } from '@nestjs/common';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';

/**
 * Clubes (/admin/clubes). Acceso para el rol Club y Admin.
 * TODO: las vistas son estáticas; conectar con ClubesService cuando exista el CRUD.
 */
@Controller('admin/clubes')
export class ClubesController {
  @Roles(Role.club)
  @Get()
  @Render('clubes/views/listado')
  listado() {
    return {};
  }

  @Roles(Role.club)
  @Get('nuevo')
  @Render('clubes/views/nuevo')
  nuevo() {
    return {};
  }
}
