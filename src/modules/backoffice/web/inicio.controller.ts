import { Body, Controller, Get, Post, Redirect, Render } from '@nestjs/common';
import { Roles } from '@common/decorators';
import { ACCESS } from '../access';
import { InicioService } from '../../domain/contenido/inicio.service';

/** Portada del sitio (/admin/web/inicio). Rol: Comunicación (y Admin). */
@Roles(...ACCESS.web)
@Controller('admin/web/inicio')
export class InicioController {
  constructor(private readonly inicio: InicioService) {}

  /** Muestra el formulario con el contenido actual de la portada. */
  @Get()
  @Render('backoffice/web/views/inicio/index')
  async ver() {
    return { inicio: await this.inicio.obtener() };
  }

  /** Guarda la portada y vuelve a mostrarla. */
  @Post()
  @Redirect('/admin/web/inicio')
  async guardar(@Body() dto: Record<string, string>) {
    await this.inicio.guardar(dto);
  }
}
