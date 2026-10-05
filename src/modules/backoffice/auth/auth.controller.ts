import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfig, InjectConfig } from '@common/config';
import { Public } from '@common/decorators';
import { ROLE_LABELS } from '@common/types';
import { AuthService } from '../../core/auth/auth.service';
import { SessionService } from '../../core/auth/session.service';
import { UsersService } from '../../core/users/users.service';
import { redirectAfterLogin, safeNext } from './redirect';

const LOGIN_VIEW = 'backoffice/auth/views/login';

/**
 * Pantalla de login (/admin/login) y logout (/admin/logout).
 *
 * Flujo: el sitio público enlaza a /admin/login; al ingresar, el usuario va a
 * la ruta que pedía (`next`) o, si no pedía ninguna, a la página de su rol
 * (ver `landingFor` en access.ts).
 * El acceso rápido de desarrollo vive aparte: ver DevLoginController.
 */
@Controller('admin')
export class AuthController {
  constructor(
    @InjectConfig() private readonly config: AppConfig,
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly users: UsersService,
  ) {}

  /** Muestra el formulario. Si ya hay sesión, redirige a `next` (o a la página de su rol). */
  @Public()
  @Get('login')
  async loginForm(@Req() req: Request, @Res() res: Response, @Query('next') next?: string) {
    if (req.user) return res.redirect(redirectAfterLogin(next, req.user));
    return res.render(LOGIN_VIEW, await this.viewData(next));
  }

  /** Valida email + contraseña. Éxito: abre sesión y redirige. Error: 401 con el formulario. */
  @Public()
  @Post('login')
  async login(
    @Body() body: { email?: string; password?: string; next?: string },
    @Res() res: Response,
  ) {
    const user = await this.auth.validateCredentials(body.email, body.password);
    if (!user) {
      return res
        .status(401)
        .render(LOGIN_VIEW, await this.viewData(body.next, { error: 'Email o contraseña incorrectos.', email: body.email }));
    }

    this.sessions.start(res, user.id);
    return res.redirect(redirectAfterLogin(body.next, user));
  }

  /** Requiere sesión (no es @Public); cualquier rol puede cerrar la suya. */
  @Post('logout')
  logout(@Res() res: Response) {
    this.sessions.end(res);
    return res.redirect('/admin/login');
  }

  /**
   * Datos de la vista de login. Si el login de desarrollo está activo suma la
   * lista `devUsers` (un botón por usuario de ejemplo).
   * `next` viaja vacío si no hay una ruta válida: así el destino lo decide el rol.
   */
  private async viewData(next?: string, extra: Record<string, unknown> = {}) {
    const devUsers = this.config.auth.devLogin
      ? (await this.users.listActive()).map((u) => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          roles: u.roles.map((r) => ROLE_LABELS[r]).join(', '),
        }))
      : undefined;
    return { next: safeNext(next) ?? '', devUsers, ...extra };
  }
}
