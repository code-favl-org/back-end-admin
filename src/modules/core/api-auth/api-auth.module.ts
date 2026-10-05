import { Module } from '@nestjs/common';
import { API_AUTH_STRATEGIES } from './api-auth-strategy';
import { ApiClientMiddleware } from './api-client.middleware';
import { RateLimitService } from './rate-limit.service';
import { VisitorCookieStrategy } from './visitor-cookie.strategy';
import { VisitorMiddleware } from './visitor.middleware';
import { VisitorService } from './visitor.service';

/**
 * Identificación de quien consume la API y del visitante del sitio público.
 *
 * Estrategias activas, en orden de prueba. Para la opción B (otros sitios con
 * API key o JWT) se suma acá la nueva estrategia; ver ApiAuthStrategy.
 */
@Module({
  providers: [
    VisitorService,
    VisitorCookieStrategy,
    RateLimitService,
    {
      provide: API_AUTH_STRATEGIES,
      useFactory: (cookie: VisitorCookieStrategy) => [
        // new ApiKeyStrategy(...), new JwtStrategy(...)   <- opción B, antes de la cookie
        cookie, // opción A: sitio propio, mismo dominio
      ],
      inject: [VisitorCookieStrategy],
    },
    ApiClientMiddleware,
    VisitorMiddleware,
  ],
  // El middleware se instancia en el módulo que lo aplica (ApiModule / PublicModule),
  // por eso también se exportan sus dependencias.
  exports: [VisitorService, ApiClientMiddleware, VisitorMiddleware, RateLimitService, API_AUTH_STRATEGIES],
})
export class ApiAuthModule {}
