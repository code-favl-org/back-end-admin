import { Controller, Get, Render } from '@nestjs/common';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';
import { BannersService } from './banners.service';

/** Banners del sitio (/admin/web/banners). Rol: Comunicación (y Admin). */
@Controller('admin/web/banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Roles(Role.editor)
  @Get()
  @Render('banners/views/index')
  async listado() {
    return { banners: await this.banners.listar() };
  }
}
