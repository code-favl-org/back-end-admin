import { existsSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { APP_CONFIG, AppConfig } from './config';
import { setupHttpLogging } from './config/http-logging.config';
import { setupNunjucks } from './config/nunjucks.config';
import { setupSwagger, SWAGGER_PATH } from './config/swagger.config';

async function bootstrap() {
  if (existsSync('.env')) process.loadEnvFile('.env'); // opcional, ver .env.example

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);

  // Cada pedido queda en consola con su cuerpo: método, ruta, estado, duración y `dto={...}`.
  setupHttpLogging(app, config.requestLog);

  app.use(cookieParser());

  // css/js/img (AdminLTE, TinyMCE...) servidos desde /public bajo /static/
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/static/' });
  // Imágenes subidas desde el backoffice: se sirven bajo su propia ruta (/upload), que es la que se
  // guarda en la base. Así el mismo valor funciona acá y detrás de nginx o un CDN.
  app.useStaticAssets(join(process.cwd(), 'public', 'upload'), { prefix: '/upload/' });
  setupNunjucks(app, config);
  setupSwagger(app);

  await app.listen(config.port);
  console.log(`Backoffice: http://localhost:${config.port}/admin`);
  console.log(`Swagger:    http://localhost:${config.port}/${SWAGGER_PATH}`);
}
bootstrap();
