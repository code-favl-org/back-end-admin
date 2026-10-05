import { Controller, Get, Render } from '@nestjs/common';
import { Roles } from '@common/decorators';
import { ACCESS } from '../access';
import { BannersService } from '../../domain/contenido/banners.service';

/** Banners del sitio (/admin/web/banners). Rol: Comunicación (y Admin). */
@Roles(...ACCESS.web)
@Controller('admin/web/banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @Render('backoffice/web/views/banners/index')
  async listado() {
    return { banners: await this.banners.listar() };
  }
}
