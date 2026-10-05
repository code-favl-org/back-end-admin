import { Controller, Get, Redirect, Render } from '@nestjs/common';

/**
 * Panel de inicio (/admin y /admin/panel).
 * Sin @Roles: cualquier usuario autenticado, de cualquier rol, puede entrar.
 */
@Controller('admin')
export class PanelController {
  /** /admin -> /admin/panel */
  @Get()
  @Redirect('/admin/panel')
  index() {}

  /** Tarjetas con los números del panel. */
  @Get('panel')
  @Render('backoffice/panel/views/index')
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
