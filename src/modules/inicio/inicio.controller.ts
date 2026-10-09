import { Body, Controller, Get, Post, Query, Redirect, Render, UploadedFile, UseFilters, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/authorization';
import { FormUploadExceptionFilter } from '../../common/filters/form-upload-exception.filter';
import { marcado } from '../../common/forms';
import { imageUploads } from '../../common/upload/image-upload';
import { Role } from '../../common/types/role';
import type { PortadaInicio } from './inicio.service';
import { InicioService } from './inicio.service';

/** Subida de la imagen de portada: `public/upload/inicio`, servida como `/upload/inicio/<archivo>`. */
const PORTADA = imageUploads('inicio');

/** Campos del formulario: los de texto de la portada más los del control de imagen. */
interface FormularioPortada extends Partial<PortadaInicio> {
  /** Checkbox "quitar la imagen actual": el navegador manda `si` sólo cuando está marcado. */
  quitarImagen?: string;
}

/**
 * Portada del sitio (/admin/web/inicio). Rol: Comunicación (y Admin).
 *
 * El POST es multipart porque incluye la imagen; el filtro de subida devuelve los rechazos de
 * multer al propio formulario en vez de una respuesta JSON (ver common/filters).
 */
@ApiTags('Web · Portada')
@UseFilters(FormUploadExceptionFilter)
@Controller('admin/web/inicio')
export class InicioController {
  constructor(private readonly inicio: InicioService) {}

  /** Muestra el formulario con el contenido actual de la portada. */
  @Roles(Role.editor)
  @Get()
  @Render('inicio/views/index')
  @ApiOperation({
    summary: 'Ver portada',
    description: 'HTML con los textos y la imagen actuales. Rol: editor o admin.',
  })
  async ver(@Query('error') error?: string) {
    // El mensaje lo agrega el filtro de subida al volver de un archivo rechazado.
    return { inicio: await this.inicio.obtener(), error: (error ?? '').slice(0, 200) };
  }

  /** Guarda la portada y vuelve a mostrarla. */
  @Roles(Role.editor)
  @Post()
  @Redirect('/admin/web/inicio')
  @UseInterceptors(FileInterceptor('imagen', PORTADA.opciones))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Guardar portada',
    description:
      'Los campos que no se envíen se conservan tal como estaban. La imagen se guarda en ' +
      '`public/upload/inicio` y se sirve como `/upload/inicio/<archivo>` (esa ruta es la que se ' +
      'guarda en la base; nginx o un CDN pueden servirla por delante). Si no se envía archivo se ' +
      'mantiene la actual, y con `quitarImagen` se borra.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', example: 'Bienvenidos a FAVL' },
        subtitulo: { type: 'string', example: 'Federación Argentina de Vuelo Libre' },
        descripcion: { type: 'string', example: 'Somos la federación que agrupa a los clubes y pilotos.' },
        imagen: { type: 'string', format: 'binary', description: 'PNG, JPG, WEBP o GIF (máx. 2 MB).' },
        quitarImagen: {
          type: 'boolean',
          description: 'Borra la imagen actual (si además se envía un archivo, gana el archivo).',
        },
      },
    },
  })
  @ApiResponse({ status: 302, description: 'Redirige otra vez a la portada.' })
  async guardar(@Body() dto: FormularioPortada, @UploadedFile() imagen?: Express.Multer.File) {
    await this.inicio.guardar(dto, {
      imagenUrl: imagen ? PORTADA.urlDe(imagen.filename) : undefined,
      quitar: marcado(dto.quitarImagen),
    });
  }
}
