import { Body, Controller, Get, Post, Redirect, Render } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';
import { ClubesService } from '../clubes/clubes.service';
import { SociosService } from './socios.service';

/**
 * Padrón de socios (/admin/socios). Los permisos se declaran por operación.
 */
@ApiTags('Socios')
@Controller('admin/socios')
export class SociosController {
  constructor(
    private readonly socios: SociosService,
    private readonly clubes: ClubesService,
  ) {}

  /** Listado de socios. */
  @Roles(Role.cd)
  @Get()
  @Render('socios/views/listado')
  @ApiOperation({ summary: 'Padrón de socios', description: 'HTML con el listado. Rol: comisión directiva.' })
  async listado() {
    return { socios: await this.socios.listar() };
  }

  /** Formulario de alta (necesita la lista de clubes para el selector). */
  @Roles(Role.cd)
  @Get('nuevo')
  @Render('socios/views/nuevo')
  @ApiOperation({
    summary: 'Formulario de alta',
    description: 'HTML con el formulario y los clubes para el selector. Rol: comisión directiva.',
  })
  async nuevo() {
    return { clubes: await this.clubes.nombres() };
  }

  /** Guarda el socio y vuelve al listado. */
  @Roles(Role.cd)
  @Post()
  @Redirect('/admin/socios')
  @ApiOperation({ summary: 'Alta de socio' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'apellido', 'dni'],
      properties: {
        nombre: { type: 'string', example: 'Juan' },
        apellido: { type: 'string', example: 'Pérez' },
        dni: { type: 'string', example: '30123456' },
        email: { type: 'string', format: 'email', example: 'jperez@correo.com' },
        telefono: { type: 'string', example: '3511234567' },
        club: { type: 'string', description: 'Nombre del club del selector.', example: 'Club Cóndor' },
        fechaAlta: { type: 'string', format: 'date', example: '2026-03-01' },
        estado: { type: 'string', description: 'Estado del padrón.', example: 'Activo' },
      },
    },
  })
  @ApiResponse({ status: 302, description: 'Redirige al listado.' })
  async crear(@Body() dto: Record<string, string>) {
    await this.socios.crear(dto);
  }

  @Roles(Role.cd, Role.tesorero)
  @Get('cuotas')
  @Render('socios/views/cuotas')
  @ApiOperation({ summary: 'Estado de cuotas', description: 'HTML con las cuotas por socio y mes. Roles: comisión directiva y tesorero.' })
  async cuotas() {
    return this.socios.cuotas();
  }
}
