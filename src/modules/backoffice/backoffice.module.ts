import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CoreModule } from '../core/core.module';
import { SessionMiddleware } from '../core/auth/session.middleware';
import { AuthController } from './auth/auth.controller';
import { DevLoginController } from './auth/dev-login.controller';
import { ClubesModule } from './clubes/clubes.module';
import { PanelModule } from './panel/panel.module';
import { SociosModule } from './socios/socios.module';
import { WebModule } from './web/web.module';
import { BackofficeExceptionFilter } from './shared/backoffice-exception.filter';
import { backofficeLocals } from './shared/backoffice.locals';

/**
 * Sitio administrativo (/admin/*). Requiere sesión; cada sección exige
 * ciertos roles (ver access.ts). Solo el login es anónimo (/admin/login y,
 * únicamente en desarrollo, /admin/dev-login).
 */
@Module({
  imports: [CoreModule, PanelModule, SociosModule, ClubesModule, WebModule],
  controllers: [AuthController, DevLoginController],
  providers: [{ provide: APP_FILTER, useClass: BackofficeExceptionFilter }],
})
export class BackofficeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // El orden dentro de apply() está garantizado: primero se identifica al
    // usuario (req.user), después se arman las variables de las vistas.
    consumer.apply(SessionMiddleware, backofficeLocals).forRoutes('admin', 'admin/{*splat}');
  }
}
