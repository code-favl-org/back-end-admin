import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Request, Response } from 'express';
import { AppConfig, InjectConfig } from '@common/config';

/** Rutas que NO son del sitio público: ahí un 404 es un 404. */
const NO_SPA = /^\/(api|admin|static)(\/|\?|$)/;

/**
 * Sirve el sitio público (React, ya compilado) como "última ruta": cualquier GET
 * de una página que ninguna otra ruta atendió devuelve `index.html`, y el router
 * del frontend decide qué mostrar (`/novedades/algo`, `/mapa`...). Una recarga o
 * un link directo funcionan igual que navegar dentro del sitio.
 *
 * El `index.html` sale por acá y no por archivos estáticos a propósito: es el
 * momento en que el navegador recibe su cookie de visitante (VisitorMiddleware).
 */
@Catch(NotFoundException)
export class SpaFallbackFilter extends BaseExceptionFilter implements ExceptionFilter {
  private readonly index: string;

  constructor(@InjectConfig() config: AppConfig) {
    super();
    this.index = join(process.cwd(), config.frontendDist, 'index.html');
  }

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const esPagina = req.method === 'GET' && !NO_SPA.test(req.originalUrl) && req.accepts(['html', 'json']) === 'html';
    if (!esPagina) return super.catch(exception, host);

    if (!existsSync(this.index)) {
      return res.status(404).type('text').send('Frontend sin compilar: ejecutá "npm run build:frontend" (o usá "npm run dev:frontend").');
    }
    return res.sendFile(this.index);
  }
}
