import { join } from 'path';
import * as nunjucks from 'nunjucks';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { APP_CONFIG, AppConfig } from '@common/config';

/**
 * Motor de vistas (Nunjucks, solo para el backoffice), archivos estáticos y proxy.
 * Se llama una vez desde main.ts.
 *
 * La raíz de plantillas es `src/modules`, así cada vista se nombra con su
 * módulo:  "backoffice/socios/views/listado".
 */
export function setupHttp(app: NestExpressApplication) {
  const config = app.get<AppConfig>(APP_CONFIG);

  nunjucks.configure(join(__dirname, '..', '..'), {
    express: app,
    autoescape: true,
    noCache: !config.isProd,
  });
  app.setViewEngine('njk');

  // css/js/assets de AdminLTE, TinyMCE, etc. -> /static/...
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/static/' });

  // Sitio público compilado (React) en la raíz: /assets/..., favicon, etc.
  // `index: false`: el index.html NO sale de acá sino de SpaFallbackFilter, que además
  // le entrega la cookie de visitante al navegador.
  app.useStaticAssets(join(process.cwd(), config.frontendDist), { index: false });

  // Detrás de un proxy, `req.ip` (usado para el límite de uso) debe ser la IP real del cliente.
  if (config.trustProxy) app.set('trust proxy', 1);
}
