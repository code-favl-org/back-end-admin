import type { ApiClient } from './api-client';
import type { AuthUser } from './auth-user';

// Tipa `req.user` en todo el proyecto.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Quién hace el pedido a /api/*. Lo completa ApiClientMiddleware (core). */
      client?: ApiClient;
    }
  }
}

export {};
