import { Body, Controller, ForbiddenException, Get, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../common/authorization';
import { AuthService } from './auth.service';
import { redirectAfterLogin, safeNext } from './redirect';
import { SessionService } from './session.service';

const LOGIN_VIEW = 'auth/views/login';

/**
 * Controla las páginas de inicio y cierre de sesión del backoffice.
 *
 * Las operaciones de autenticación y emisión/revocación de tokens las realizan
 * `AuthService` y `SessionService`; este controlador decide qué respuesta HTTP enviar:
 * mostrar el formulario, guardar las cookies o redirigir al usuario.
 *
 * Las tres rutas son públicas para que se pueda ver el formulario antes de iniciar
 * sesión y para que siempre sea posible cerrar una sesión existente. Esto no significa
 * que las páginas privadas del backoffice sean públicas.
 */
@Controller('admin')
export class AuthController {
  constructor(
    /** Comprueba credenciales, crea tokens y revoca sesiones. */
    private readonly auth: AuthService,
    /** Lee, establece y elimina las cookies que contienen los tokens. */
    private readonly sessions: SessionService,
  ) {}

  /**
   * Muestra el formulario de acceso.
   *
   * Si el middleware ya encontró una sesión válida (`req.user`), no hace falta
   * pedir las credenciales otra vez: redirige a `next` si es una ruta interna
   * segura del backoffice, o a la página inicial correspondiente al rol.
   * Sin sesión, renderiza la vista y conserva un `next` seguro en el formulario.
   *
   * @param req Petición HTTP; el middleware puede haber añadido el usuario autenticado.
   * @param res Respuesta usada para renderizar la vista o redirigir.
   * @param next Destino solicitado originalmente, recibido en `?next=`.
   */
  @Public()
  @Get('login')
  loginForm(@Req() req: Request, @Res() res: Response, @Query('next') next?: string) {
    if (req.user) return res.redirect(redirectAfterLogin(next, req.user));
    return res.render(LOGIN_VIEW, { next: safeNext(next) ?? '' });
  }

  /**
   * Procesa el envío del formulario de acceso.
   *
   * Pide a `AuthService` que autentique al usuario y genere un par de tokens.
   * Si la operación tiene éxito, `SessionService` guarda los tokens en cookies
   * y se redirige al destino seguro indicado por `next` o al inicio del rol.
   * Si las credenciales no son válidas (401) o el rol no tiene acceso (403),
   * vuelve a mostrar el formulario con el mensaje correspondiente. Otros errores
   * se propagan al manejador global para no ocultar fallos del servidor.
   *
   * @param req Petición HTTP en la que se asociarán las cookies de sesión.
   * @param res Respuesta usada para escribir cookies, renderizar o redirigir.
   * @param body Campos enviados por el formulario: `usuario`, `password` y `next`.
   */
  @Public()
  @Post('login')
  async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { usuario?: string; password?: string; next?: string },
  ) {
    try {
      // El servicio decide el método de autenticación (incluido el bypass local, si está habilitado).
      const tokens = await this.auth.login(body.usuario ?? '', body.password ?? '');
      // El navegador recibirá los tokens como cookies y podrá enviarlos en pedidos siguientes.
      this.sessions.start(req, res, tokens);
      return res.redirect(redirectAfterLogin(body.next, tokens.user));
    } catch (error) {
      // Solo los rechazos esperados de autenticación se presentan en el formulario.
      // Errores inesperados (por ejemplo, de base de datos o configuración) siguen al filtro global.
      if (!(error instanceof UnauthorizedException || error instanceof ForbiddenException)) throw error;
      return res.status(error.getStatus()).render(LOGIN_VIEW, {
        next: safeNext(body.next) ?? '',
        usuario: body.usuario,
        error: error.message,
      });
    }
  }

  /**
   * Cierra la sesión actual.
   *
   * Lee los tokens de las cookies, solicita su revocación al servicio y elimina
   * las cookies del navegador. La ruta es pública intencionalmente: si la sesión
   * ya venció o no existe, el usuario igualmente debe poder volver al formulario.
   *
   * @param req Petición HTTP que puede contener las cookies de access y refresh.
   * @param res Respuesta donde se borrarán las cookies antes de redirigir.
   */
  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const { accessToken, refreshToken } = this.sessions.tokensFrom(req);
    await this.auth.logout(accessToken, refreshToken);
    this.sessions.end(res);
    return res.redirect('/admin/login');
  }
}
