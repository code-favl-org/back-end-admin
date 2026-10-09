import { ArgumentsHost, BadRequestException, Catch, HttpException, PayloadTooLargeException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request, Response } from 'express';
import { isBackofficePath } from '../middleware/backoffice.locals';
import { MAX_IMAGE_BYTES } from '../upload/image-upload';

/**
 * Errores de subida en formularios HTML: en vez del JSON de error, vuelve al formulario con el mensaje.
 *
 * Se registra solo en los controladores que reciben archivos (`@UseFilters`), porque cambia la
 * respuesta esperada: un 400 JSON sigue siendo lo correcto para una API o para un pedido que no
 * sea multipart (esos casos se delegan al manejador normal).
 *
 * Cubre lo que rechaza multer antes de llegar al controlador: archivo demasiado grande (413) o de
 * un tipo que no es imagen (400, lo lanza el filtro de tipo de `common/upload`).
 */
@Catch(BadRequestException, PayloadTooLargeException)
export class FormUploadExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (!isBackofficePath(req.originalUrl) || !req.is('multipart/form-data')) {
      return super.catch(exception, host);
    }

    // El 413 lo arma multer con su propio texto ("File too large"): acá se traduce al del formulario.
    const mensaje =
      exception instanceof PayloadTooLargeException
        ? `La imagen supera el máximo de ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.`
        : exception.message.slice(0, 200);

    // Vuelve a la misma dirección del formulario; el GET muestra el mensaje (ver inicio/views/index.njk).
    return res.redirect(`${req.path}?error=${encodeURIComponent(mensaje)}`);
  }
}
