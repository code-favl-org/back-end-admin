import {
  ArgumentsHost,
  Catch,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request, Response } from 'express';
import { isBackofficePath } from './backoffice.locals';

/**
 * El backoffice es un sitio HTML, no una API: en vez de un JSON 401/403
 *  - sin sesión  -> redirige al login (recordando a dónde quería ir)
 *  - sin permiso -> muestra la página 403
 * Fuera de /admin (api, public) deja el comportamiento normal de Nest.
 */
@Catch(UnauthorizedException, ForbiddenException)
export class BackofficeExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (!isBackofficePath(req.originalUrl)) return super.catch(exception, host);

    if (exception instanceof UnauthorizedException) {
      const next = req.method === 'GET' ? `?next=${encodeURIComponent(req.originalUrl)}` : '';
      return res.redirect(`/admin/login${next}`);
    }
    return res.status(403).render('backoffice/shared/views/errors/403');
  }
}
