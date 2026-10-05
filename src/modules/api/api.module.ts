import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ApiClientMiddleware } from '../core/api-auth/api-client.middleware';
import { DomainModule } from '../domain/domain.module';
import { AuthApiController } from './auth.api.controller';
import { GaleriaApiController } from './galeria.api.controller';
import { HomeApiController } from './home.api.controller';
import { NoticiasApiController } from './noticias.api.controller';
import { NovedadesApiController } from './novedades.api.controller';
import { PilotosApiController } from './pilotos.api.controller';
import { SitiosApiController } from './sitios.api.controller';

/**
 * API JSON (/api/*) que consume el sitio público.
 *
 * Los controladores son @Public (no piden usuario registrado), pero NO están
 * abiertos: todo /api/* exige un cliente identificado (ApiClientGuard) y tiene
 * límite de uso. Hoy se identifica con la cookie de visitante; para que otros
 * sitios consuman la API con API key o JWT, ver ApiAuthStrategy (core/api-auth).
 */
@Module({
  imports: [CoreModule, DomainModule],
  controllers: [
    NoticiasApiController,
    NovedadesApiController,
    GaleriaApiController,
    SitiosApiController,
    HomeApiController,
    PilotosApiController,
    AuthApiController,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiClientMiddleware).forRoutes('api', 'api/{*splat}');
  }
}
