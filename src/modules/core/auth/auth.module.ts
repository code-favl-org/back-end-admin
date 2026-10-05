import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { SessionMiddleware } from './session.middleware';
import { SessionService } from './session.service';

/** Autenticación: verificación de credenciales, sesión por cookie y middleware que completa `req.user`. */
@Module({
  imports: [UsersModule],
  providers: [AuthService, SessionService, SessionMiddleware],
  exports: [AuthService, SessionService, SessionMiddleware, UsersModule],
})
export class AuthModule {}
