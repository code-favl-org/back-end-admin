import { join } from 'path';
import * as nunjucks from 'nunjucks';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { AppConfig } from './configuration';

/**
 * Motor de vistas (Nunjucks). Rutas de búsqueda, desde la raíz del proyecto:
 *  - views/        -> layouts, partials, macros y errors (compartidas):  "layouts/base.njk"
 *  - src/modules/  -> vistas de cada módulo:                              "socios/views/listado"
 *
 * Como en app.zip, se leen desde `src/modules` (no desde `dist/`): hay que ejecutar
 * la app desde la raíz del proyecto.
 */
export function setupNunjucks(app: NestExpressApplication, config: AppConfig) {
  const root = process.cwd();
  nunjucks.configure([join(root, 'views'), join(root, 'src', 'modules')], {
    autoescape: true,
    express: app,
    noCache: !config.isProd,
  });
  app.setViewEngine('njk');
}
