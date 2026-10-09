import { Controller, Get, Render } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';

/**
 * Clubes (/admin/clubes). Acceso para el rol Club y Admin.
 * TODO: las vistas son estáticas; conectar con ClubesService cuando exista el CRUD.
 */
@ApiTags('Clubes')
@Controller('admin/clubes')
export class ClubesController {
  @Roles(Role.club)
  @Get()
  @Render('clubes/views/listado')
  @ApiOperation({ summary: 'Listado de clubes', description: 'HTML (vista estática). Roles: Club o Admin.' })
  listado() {
    return {};
  }

  @Roles(Role.club)
  @Get('nuevo')
  @Render('clubes/views/nuevo')
  @ApiOperation({ summary: 'Formulario de alta de club', description: 'HTML (vista estática). Roles: Club o Admin.' })
  nuevo() {
    return {};
  }
}
