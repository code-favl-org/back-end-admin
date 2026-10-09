import { Body, Controller, Get, Param, Post, Query, Redirect, Render, UploadedFile, UseFilters, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/authorization';
import { CurrentUser } from '../../common/decorators';
import { FormUploadExceptionFilter } from '../../common/filters/form-upload-exception.filter';
import { marcado } from '../../common/forms';
import { imageUploads } from '../../common/upload/image-upload';
import type { AuthUser } from '../../common/types';
import { Role } from '../../common/types/role';
import type { FormularioNoticia } from './noticias.service';
import { NoticiasService } from './noticias.service';

/** Subida de la portada de la noticia: `public/upload/news`, servida como `/upload/news/<archivo>`. */
const PORTADA = imageUploads('news');

/** Campos que recibe el POST: son los que existen en `news_articles` (ver FormularioNoticia). */
const CUERPO_NOTICIA = {
  schema: {
    type: 'object',
    required: ['titulo'],
    properties: {
      titulo: { type: 'string', example: 'Nuevo récord argentino en ala delta' },
      resumen: { type: 'string', example: 'El piloto cordobés voló 340 km sin motor.' },
      contenido: { type: 'string', description: 'HTML del cuerpo de la noticia.' },
      estado: { type: 'string', enum: ['borrador', 'publicada'], example: 'borrador' },
      fecha: { type: 'string', format: 'date', example: '2026-03-02' },
      categoria: { type: 'string', example: 'Competiciones' },
      tags: { type: 'string', description: 'Etiquetas separadas por coma.', example: 'Ala Delta, Récord' },
      destacadaEnHero: { type: 'boolean', description: 'Si aparece en el carrusel de la portada.' },
      portada: { type: 'string', format: 'binary', description: 'PNG, JPG, WEBP o GIF (máx. 2 MB).' },
      quitarPortada: { type: 'boolean', description: 'Borra la portada actual (si además se envía un archivo, gana el archivo).' },
    },
  },
};

/**
 * Gestión de noticias del sitio (/admin/web/noticias). Rol: Comunicación (y Admin).
 *
 * Lee y escribe la tabla `news_articles` (la misma que consume la API pública). El autor no se
 * escribe a mano: se guarda el usuario logueado en `author_id`. El POST es multipart por la portada,
 * y los rechazos de subida vuelven al formulario en vez de una respuesta JSON.
 */
@ApiTags('Web · Noticias')
@UseFilters(FormUploadExceptionFilter)
@Controller('admin/web/noticias')
export class NoticiasController {
  constructor(private readonly noticias: NoticiasService) {}

  /** Listado de noticias (publicadas y borradores). */
  @Roles(Role.editor)
  @Get()
  @Render('noticias/views/listado')
  @ApiOperation({ summary: 'Listado de noticias', description: 'HTML con publicadas y borradores. Rol: editor o admin.' })
  async listado(@Query('error') error?: string) {
    // El mensaje lo agrega el filtro de subida (o el de alta con título vacío) al volver al listado.
    return { noticias: await this.noticias.listar(), error: (error ?? '').slice(0, 200) };
  }

  /** Formulario de alta; el autor se completa con el usuario logueado. */
  @Roles(Role.editor)
  @Get('nueva')
  @Render('noticias/views/nueva')
  @ApiOperation({
    summary: 'Formulario de nueva noticia',
    description: 'HTML con el formulario y las categorías. El autor se completa con el usuario logueado.',
  })
  async nueva(@CurrentUser() user: AuthUser) {
    return {
      noticia: { estado: 'borrador', autor: user.nombre, tags: [], destacadaEnHero: false },
      categorias: await this.noticias.categorias(),
      action: '/admin/web/noticias',
      error: '',
    };
  }

  /** Crea la noticia y vuelve al listado. */
  @Roles(Role.editor)
  @Post()
  @Redirect('/admin/web/noticias')
  @UseInterceptors(FileInterceptor('portada', PORTADA.opciones))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear noticia',
    description:
      'Guarda la noticia en `news_articles`. El autor es el usuario logueado y la portada se guarda ' +
      'en `public/upload/news` (servida como `/upload/news/<archivo>`). Si no se envía estado, queda como borrador.',
  })
  @ApiBody(CUERPO_NOTICIA)
  @ApiResponse({ status: 302, description: 'Redirige al listado.' })
  async crear(
    @Body() dto: FormularioNoticia,
    @CurrentUser() user: AuthUser,
    @UploadedFile() portada?: Express.Multer.File,
  ) {
    await this.noticias.crear(dto, { id: user.id, nombre: user.nombre }, {
      imagenUrl: portada ? PORTADA.urlDe(portada.filename) : undefined,
    });
  }

  /** Formulario de edición de la noticia `id`. */
  @Roles(Role.editor)
  @Get(':id/editar')
  @Render('noticias/views/editar')
  @ApiOperation({ summary: 'Formulario de edición', description: 'HTML con el formulario de la noticia `id`.' })
  async editar(@Param('id') id: string, @Query('error') error?: string) {
    return {
      noticia: await this.noticias.obtener(id),
      categorias: await this.noticias.categorias(),
      action: `/admin/web/noticias/${id}`,
      error: (error ?? '').slice(0, 200),
    };
  }

  /** Guarda los cambios de la noticia `id` y vuelve al listado. */
  @Roles(Role.editor)
  @Post(':id')
  @Redirect('/admin/web/noticias')
  @UseInterceptors(FileInterceptor('portada', PORTADA.opciones))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Guardar cambios de la noticia',
    description:
      'Los campos que no se envíen se conservan tal como estaban. Si se envía una portada nueva, la ' +
      'anterior se borra de `public/upload/news`; con `quitarPortada` se borra sin reemplazarla.',
  })
  @ApiBody(CUERPO_NOTICIA)
  @ApiResponse({ status: 302, description: 'Redirige al listado.' })
  async actualizar(
    @Param('id') id: string,
    @Body() dto: FormularioNoticia,
    @UploadedFile() portada?: Express.Multer.File,
  ) {
    await this.noticias.actualizar(id, dto, {
      imagenUrl: portada ? PORTADA.urlDe(portada.filename) : undefined,
      quitar: marcado(dto.quitarPortada),
    });
  }
}

