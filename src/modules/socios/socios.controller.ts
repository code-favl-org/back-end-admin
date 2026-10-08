import { Body, Controller, Get, Post, Redirect, Render } from '@nestjs/common';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';
import { ClubesService } from '../clubes/clubes.service';
import { SociosService } from './socios.service';

/**
 * Padrón de socios (/admin/socios). Los permisos se declaran por operación.
 */
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
  async listado() {
    return { socios: await this.socios.listar() };
  }

  /** Formulario de alta (necesita la lista de clubes para el selector). */
  @Roles(Role.cd)
  @Get('nuevo')
  @Render('socios/views/nuevo')
  async nuevo() {
    return { clubes: await this.clubes.nombres() };
  }

  /** Guarda el socio y vuelve al listado. */
  @Roles(Role.cd)
  @Post()
  @Redirect('/admin/socios')
  async crear(@Body() dto: Record<string, string>) {
    await this.socios.crear(dto);
  }

  @Roles(Role.cd, Role.tesorero)
  @Get('cuotas')
  @Render('socios/views/cuotas')
  async cuotas() {
    return this.socios.cuotas();
  }
}
