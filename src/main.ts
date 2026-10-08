import { existsSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { APP_CONFIG, AppConfig } from './config';
import { setupNunjucks } from './config/nunjucks.config';

async function bootstrap() {
  if (existsSync('.env')) process.loadEnvFile('.env'); // opcional, ver .env.example

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);

  app.use(cookieParser());

  // css/js/img (AdminLTE, TinyMCE...) servidos desde /public bajo /static/
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/static/' });
  setupNunjucks(app, config);

  await app.listen(config.port);
  console.log(`Backoffice: http://localhost:${config.port}/admin`);
}
bootstrap();
