import { Controller, Get, Redirect, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PANEL_PATH, PANEL_VIEW, panelLocals } from '../../common/navigation';

/**
 * Panel de inicio del backoffice (`/admin` y `/admin/panel`).
 * Un solo marco de vista que incluye el parcial del rol (`panelAdmin`, `panelClub`, …).
 */
@ApiTags('Panel')
@Controller('admin')
export class PanelController {
  /** /admin -> /admin/panel */
  @Get()
  @Redirect(PANEL_PATH)
  @ApiOperation({ summary: 'Redirigir al panel' })
  @ApiResponse({ status: 302, description: 'Redirige a `/admin/panel`.' })
  index() {}

  /** Panel del rol del usuario. */
  @Get('panel')
  @ApiOperation({
    summary: 'Panel de inicio',
    description: 'HTML con el panel del rol (`panelAdmin`, `panelClub`, …).',
  })
  panel(@Req() request: Request, @Res() response: Response) {
    return response.render(PANEL_VIEW, panelLocals(request.user?.roles));
  }
}
