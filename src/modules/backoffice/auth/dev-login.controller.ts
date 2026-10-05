import { Body, Controller, NotFoundException, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppConfig, InjectConfig } from '@common/config';
import { Public } from '@common/decorators';
import { SessionService } from '../../core/auth/session.service';
import { UsersService } from '../../core/users/users.service';
import { redirectAfterLogin } from './redirect';

/**
 * LOGIN DE DESARROLLO: entrar como cualquier usuario de ejemplo con un clic y
 * SIN contraseña, para probar rápido los distintos roles.
 *
 * Seguridad: solo funciona con `config.auth.devLogin` (por defecto true fuera
 * de producción). La configuración impide arrancar en producción con
 * DEV_LOGIN=true, y además cada request vuelve a chequearlo: si está apagado
 * la ruta responde 404, como si no existiera.
 */
@Controller('admin')
export class DevLoginController {
  constructor(
    @InjectConfig() private readonly config: AppConfig,
    private readonly users: UsersService,
    private readonly sessions: SessionService,
  ) {}

  /** Abre sesión como el usuario `userId` y redirige a `next` (o a la página de su rol). */
  @Public()
  @Post('dev-login')
  async devLogin(@Body() body: { userId?: string; next?: string }, @Res() res: Response) {
    if (!this.config.auth.devLogin) throw new NotFoundException();

    const user = await this.users.findById(body.userId ?? '');
    if (!user) throw new NotFoundException('Usuario de ejemplo inexistente');

    this.sessions.start(res, user.id);
    return res.redirect(redirectAfterLogin(body.next, user));
  }
}
