import { Body, Controller, Get, Param, Post, Redirect, Render } from '@nestjs/common';
import { CurrentUser, Roles } from '@common/decorators';
import { ACCESS } from '../access';
import type { AuthUser } from '@common/types';
import { NoticiasService } from '../../domain/contenido/noticias.service';

/** Gestión de noticias del sitio (/admin/web/noticias). Rol: Comunicación (y Admin). */
@Roles(...ACCESS.web)
@Controller('admin/web/noticias')
export class NoticiasController {
  constructor(private readonly noticias: NoticiasService) {}

  /** Listado de noticias (publicadas y borradores). */
  @Get()
  @Render('backoffice/web/views/noticias/listado')
  async listado() {
    return { noticias: await this.noticias.listar() };
  }

  /** Formulario de alta; el autor se completa con el usuario logueado. */
  @Get('nueva')
  @Render('backoffice/web/views/noticias/nueva')
  nueva(@CurrentUser() user: AuthUser) {
    return {
      noticia: { estado: 'borrador', autor: user.nombre },
      categorias: this.noticias.categorias(),
      action: '/admin/web/noticias',
    };
  }

  /** Crea la noticia y vuelve al listado. */
  @Post()
  @Redirect('/admin/web/noticias')
  async crear(@Body() dto: Record<string, string>) {
    await this.noticias.crear(dto);
  }

  /** Formulario de edición de la noticia `id`. */
  @Get(':id/editar')
  @Render('backoffice/web/views/noticias/editar')
  async editar(@Param('id') id: string) {
    return {
      noticia: await this.noticias.obtener(id),
      categorias: this.noticias.categorias(),
      action: `/admin/web/noticias/${id}`,
    };
  }

  /** Guarda los cambios de la noticia `id` y vuelve al listado. */
  @Post(':id')
  @Redirect('/admin/web/noticias')
  async actualizar(@Param('id') id: string, @Body() dto: Record<string, string>) {
    await this.noticias.actualizar(id, dto);
  }
}
