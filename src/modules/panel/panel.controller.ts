import { Controller, Get, Redirect, Render } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Panel de inicio (/admin y /admin/panel).
 * Sin @Roles: cualquier usuario autenticado, de cualquier rol, puede entrar.
 */
@ApiTags('Panel')
@Controller('admin')
export class PanelController {
  /** /admin -> /admin/panel */
  @Get()
  @Redirect('/admin/panel')
  @ApiOperation({ summary: 'Redirigir al panel' })
  @ApiResponse({ status: 302, description: 'Redirige a `/admin/panel`.' })
  index() {}

  /** Tarjetas con los números del panel. */
  @Get('panel')
  @Render('panel/views/index')
  @ApiOperation({
    summary: 'Panel de inicio',
    description: 'HTML con las tarjetas de números (hoy, datos de ejemplo).',
  })
  panel() {
    // TODO: reemplazar por datos reales (servicios de socios, clubes, etc.)
    return {
      stats: [
        { valor: 245, etiqueta: 'Socios activos', color: 'primary', icono: 'bi-people-fill' },
        { valor: 18, etiqueta: 'Clubes', color: 'success', icono: 'bi-building' },
        { valor: 7, etiqueta: 'Eventos este mes', color: 'warning', icono: 'bi-calendar-event' },
        { valor: 3, etiqueta: 'Cuotas pendientes', color: 'danger', icono: 'bi-cash-coin' },
      ],
    };
  }
}
