import { Body, Controller, Get, Post, Redirect, Render } from '@nestjs/common';
import { Roles } from '@common/decorators';
import { ClubesService } from '../../domain/clubes/clubes.service';
import { SociosService } from '../../domain/socios/socios.service';
import { ACCESS } from '../access';

/**
 * Padrón de socios (/admin/socios). Solo Secretaría (y Admin); las cuotas se
 * abren también a Tesorería, ver `cuotas()`.
 */
@Roles(...ACCESS.socios)
@Controller('admin/socios')
export class SociosController {
  constructor(
    private readonly socios: SociosService,
    private readonly clubes: ClubesService,
  ) {}

  /** Listado de socios. */
  @Get()
  @Render('backoffice/socios/views/listado')
  async listado() {
    return { socios: await this.socios.listar() };
  }

  /** Formulario de alta (necesita la lista de clubes para el selector). */
  @Get('nuevo')
  @Render('backoffice/socios/views/nuevo')
  async nuevo() {
    return { clubes: await this.clubes.nombres() };
  }

  /** Guarda el socio y vuelve al listado. */
  @Post()
  @Redirect('/admin/socios')
  async crear(@Body() dto: Record<string, string>) {
    await this.socios.crear(dto);
  }

  // A nivel método pisa el @Roles de la clase: acá también entra Tesorería.
  @Roles(...ACCESS.cuotas)
  @Get('cuotas')
  @Render('backoffice/socios/views/cuotas')
  async cuotas() {
    return this.socios.cuotas();
  }
}
