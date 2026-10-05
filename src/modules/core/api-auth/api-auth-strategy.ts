import type { Request, Response } from 'express';
import type { ApiClient } from '@common/types';

/**
 * Una forma de identificar a quien consume la API. ApiClientMiddleware prueba las
 * estrategias registradas EN ORDEN y se queda con la primera que devuelva un cliente.
 *
 * Para sumar un mecanismo nuevo (ej.: API key en `X-API-Key`, o `Authorization:
 * Bearer <jwt>` para que otros sitios consuman la API):
 *   1. crear una clase que implemente esta interfaz,
 *   2. agregarla al provider API_AUTH_STRATEGIES (api-auth.module.ts),
 *   3. (si es cross-site) habilitar CORS para esos orígenes.
 * Ningún controlador ni guard cambia.
 */
export interface ApiAuthStrategy {
  /** Nombre para logs/diagnóstico. */
  readonly name: string;
  /**
   * @returns El cliente si este mecanismo lo reconoce; `null` si no aplica a este
   *          request (la siguiente estrategia lo intenta).
   */
  authenticate(req: Request, res: Response): ApiClient | null | Promise<ApiClient | null>;
}

/** Token de inyección: lista ordenada de estrategias activas. */
export const API_AUTH_STRATEGIES = Symbol('API_AUTH_STRATEGIES');
