import type { AuthUser } from './auth-user';

// Tipa `req.user` en todo el proyecto.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
