import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** UI de Swagger (`/admin/docs`); el OpenAPI crudo queda en `/admin/docs/openapi.json`. */
export const SWAGGER_PATH = 'admin/docs';

/**
 * Publica la documentación OpenAPI del backoffice.
 *
 * `SwaggerModule` registra sus rutas directamente en Express (no en el router de
 * Nest), así que arrancan antes de los guards y del middleware de sesión: la
 * documentación se puede abrir sin login aunque todo `/admin` lo exija.
 *
 * El backoffice no es una API: las páginas devuelven HTML (Nunjucks) y los POST son
 * envíos de formulario que terminan en un redirect. La documentación sirve para ver
 * y probar las rutas: para probar una pantalla privada primero hay que iniciar sesión
 * en `POST /admin/login`; la cookie queda en el navegador y viaja en los siguientes
 * pedidos que hace la UI.
 *
 * @param app Aplicación ya creada, antes de `listen()` (si no, la UI no encuentra sus assets).
 */
export function setupSwagger(app: INestApplication) {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('FAVL · Backoffice')
      .setDescription(
        'Rutas del backoffice (`/admin`). Las páginas responden HTML; `POST /admin/login` deja ' +
          'la sesión en cookies. Sin sesión, toda ruta privada responde `302` al login; con ' +
          'sesión pero sin el rol requerido, `403` (página HTML).',
      )
      .setVersion('1.0.0')
      .addTag('Autenticación', 'Login y logout. La sesión vive en cookies.')
      .addTag('Panel', 'Páginas de inicio, para cualquier usuario con sesión.')
      .addTag('Usuarios', 'Cuentas del backoffice. Rol: Admin.')
      .addTag('Socios', 'Padrón de socios y cuotas. Roles: Comisión directiva y Tesorero.')
      .addTag('Clubes', 'Clubes. Rol: Club.')
      .addTag('Web · Portada', 'Textos de la portada del sitio. Rol: Editor.')
      .addTag('Web · Noticias', 'Noticias del sitio. Rol: Editor.')
      .addTag('Web · Banners', 'Banners del sitio. Rol: Editor.')
      .addTag('Web · Páginas', 'Páginas estáticas del sitio. Rol: Editor.')
      .build(),
  );

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: `${SWAGGER_PATH}/openapi.json`,
    swaggerOptions: { docExpansion: 'none', tagsSorter: 'alpha' },
  });
}
