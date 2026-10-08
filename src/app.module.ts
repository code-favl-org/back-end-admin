import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/authorization';
import { BackofficeExceptionFilter } from './common/filters/backoffice-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { backofficeLocals } from './common/middleware/backoffice.locals';
import { AppConfigModule } from './config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { BannersModule } from './modules/banners/banners.module';
import { ClubesModule } from './modules/clubes/clubes.module';
import { InicioModule } from './modules/inicio/inicio.module';
import { NoticiasModule } from './modules/noticias/noticias.module';
import { PaginasModule } from './modules/paginas/paginas.module';
import { PanelModule } from './modules/panel/panel.module';
import { SessionMiddleware } from './modules/auth/session.middleware';
import { SociosModule } from './modules/socios/socios.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    PanelModule,
    SociosModule,
    ClubesModule,
    NoticiasModule,
    BannersModule,
    PaginasModule,
    InicioModule,
    UsersModule,
  ],
  providers: [
    // Todo exige sesión salvo @Public(); después se chequean los @Roles(...). El orden importa.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // /admin es HTML: sin sesión redirige al login, sin permiso muestra el 403.
    { provide: APP_FILTER, useClass: BackofficeExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Primero se identifica al usuario (req.user), después se arman las variables de las vistas.
    consumer.apply(SessionMiddleware, backofficeLocals).forRoutes('admin', 'admin/{*splat}');
  }
}
