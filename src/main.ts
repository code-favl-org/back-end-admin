import { existsSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { APP_CONFIG, AppConfig } from '@common/config';
import { AppModule } from './app.module';
import { setupHttp } from './modules/core/http/http.setup';

/**
 * Arranque de la aplicación:
 *  1. carga `.env` si existe (opcional, ver .env.example),
 *  2. crea la app Nest (la config se valida al construir AppConfigModule),
 *  3. configura vistas y estáticos (setupHttp) y escucha en el puerto.
 */
async function bootstrap() {
  if (existsSync('.env')) process.loadEnvFile('.env'); // opcional, ver .env.example

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);

  setupHttp(app); // Nunjucks + /static

  await app.listen(config.port);
  console.log(`Sitio público: http://localhost:${config.port}/`);
  console.log(`Backoffice:    http://localhost:${config.port}/admin`);
  console.log(`API (ejemplo): http://localhost:${config.port}/api/noticias`);
  if (config.auth.devLogin) console.log('Login de desarrollo ACTIVO: /admin/login ofrece entrar sin contraseña');
}
bootstrap();
