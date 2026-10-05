import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiClient } from '@common/types';
import type { ApiAuthStrategy } from './api-auth-strategy';
import { VisitorService } from './visitor.service';

/**
 * Opción A: el sitio público llama a la API desde el mismo dominio y el navegador
 * manda solo la cookie de visitante.
 *
 * Si el pedido NO trae cookie válida no se lo reconoce (devuelve null => 401),
 * pero la respuesta lleva igual la cookie recién creada: el frontend reintenta
 * una vez y ya pasa. En producción casi nunca ocurre, porque el HTML del sitio
 * ya entrega la cookie antes de la primera llamada (ver SpaFallbackFilter).
 */
@Injectable()
export class VisitorCookieStrategy implements ApiAuthStrategy {
  readonly name = 'visitor-cookie';

  constructor(private readonly visitors: VisitorService) {}

  authenticate(req: Request, res: Response): ApiClient | null {
    const { id, isNew } = this.visitors.ensure(req, res);
    return isNew ? null : { kind: 'visitor', id };
  }
}
