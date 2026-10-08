import { Body, Controller, Get, Post, Redirect, Render } from '@nestjs/common';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';
import { InicioService } from './inicio.service';

/** Portada del sitio (/admin/web/inicio). Rol: Comunicación (y Admin). */
@Controller('admin/web/inicio')
export class InicioController {
  constructor(private readonly inicio: InicioService) {}

  /** Muestra el formulario con el contenido actual de la portada. */
  @Roles(Role.editor)
  @Get()
  @Render('inicio/views/index')
  async ver() {
    return { inicio: await this.inicio.obtener() };
  }

  /** Guarda la portada y vuelve a mostrarla. */
  @Roles(Role.editor)
  @Post()
  @Redirect('/admin/web/inicio')
  async guardar(@Body() dto: Record<string, string>) {
    await this.inicio.guardar(dto);
  }
}
