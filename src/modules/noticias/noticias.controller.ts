import { Body, Controller, Get, Param, Post, Redirect, Render } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators';
import { Roles } from '../../common/authorization';
import type { AuthUser } from '../../common/types';
import { Role } from '../../common/types/role';
import { NoticiasService } from './noticias.service';

/** Gestión de noticias del sitio (/admin/web/noticias). Rol: Comunicación (y Admin). */
@Controller('admin/web/noticias')
export class NoticiasController {
  constructor(private readonly noticias: NoticiasService) {}

  /** Listado de noticias (publicadas y borradores). */
  @Roles(Role.editor)
  @Get()
  @Render('noticias/views/listado')
  async listado() {
    return { noticias: await this.noticias.listar() };
  }

  /** Formulario de alta; el autor se completa con el usuario logueado. */
  @Roles(Role.editor)
  @Get('nueva')
  @Render('noticias/views/nueva')
  nueva(@CurrentUser() user: AuthUser) {
    return {
      noticia: { estado: 'borrador', autor: user.nombre },
      categorias: this.noticias.categorias(),
      action: '/admin/web/noticias',
    };
  }

  /** Crea la noticia y vuelve al listado. */
  @Roles(Role.editor)
  @Post()
  @Redirect('/admin/web/noticias')
  async crear(@Body() dto: Record<string, string>) {
    await this.noticias.crear(dto);
  }

  /** Formulario de edición de la noticia `id`. */
  @Roles(Role.editor)
  @Get(':id/editar')
  @Render('noticias/views/editar')
  async editar(@Param('id') id: string) {
    return {
      noticia: await this.noticias.obtener(id),
      categorias: this.noticias.categorias(),
      action: `/admin/web/noticias/${id}`,
    };
  }

  /** Guarda los cambios de la noticia `id` y vuelve al listado. */
  @Roles(Role.editor)
  @Post(':id')
  @Redirect('/admin/web/noticias')
  async actualizar(@Param('id') id: string, @Body() dto: Record<string, string>) {
    await this.noticias.actualizar(id, dto);
  }
}
