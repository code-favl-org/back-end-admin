import { Controller, Get, Render } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';
import { BannersService } from './banners.service';

/** Banners del sitio (/admin/web/banners). Rol: Comunicación (y Admin). */
@ApiTags('Web · Banners')
@Controller('admin/web/banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Roles(Role.editor)
  @Get()
  @Render('banners/views/index')
  @ApiOperation({ summary: 'Listado de banners', description: 'HTML con los banners del sitio. Rol: editor o admin.' })
  async listado() {
    return { banners: await this.banners.listar() };
  }
}
