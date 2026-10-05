import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CoreModule } from '../core/core.module';
import { VisitorMiddleware } from '../core/api-auth/visitor.middleware';
import { SpaFallbackFilter } from './spa-fallback.filter';

/**
 * Sitio público (/): la aplicación React de `frontend/`, compilada. No tiene
 * controladores propios: sus páginas las resuelve el router del frontend (ver
 * SpaFallbackFilter) y sus datos los pide a /api.
 *
 * Acá se entrega la cookie anónima de visitante al abrir cualquier página.
 */
@Module({
  imports: [CoreModule],
  providers: [{ provide: APP_FILTER, useClass: SpaFallbackFilter }],
})
export class PublicModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VisitorMiddleware)
      .exclude('api', 'api/{*splat}', 'admin', 'admin/{*splat}', 'static/{*splat}')
      .forRoutes({ path: '{*splat}', method: RequestMethod.GET });
  }
}
