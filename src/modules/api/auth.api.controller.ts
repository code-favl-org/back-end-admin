import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { Public } from '@common/decorators';

/**
 * El frontend consulta `GET /api/auth/me` al cargar para saber si hay un usuario
 * registrado. La sesión de los usuarios registrados vive en `/admin` (cookie con
 * path `/admin`, ver SessionService), así que desde el sitio público siempre
 * se es visitante: se responde 401, que el frontend interpreta como "sin sesión".
 */
@Public()
@Controller('api/auth')
export class AuthApiController {
  @Get('me')
  me() {
    throw new UnauthorizedException('Sin sesión de usuario registrado en el sitio público.');
  }
}
