import { randomBytes } from 'crypto';

/**
 * Configuración tipada de la aplicación. Se obtiene inyectando `APP_CONFIG`
 * (atajo: `@InjectConfig()`); nadie debería leer `process.env` por su cuenta.
 */
export interface AppConfig {
  /** Valor de NODE_ENV (por defecto `development`). */
  env: 'development' | 'production' | 'test';
  /** Atajo de `env === 'production'`. */
  isProd: boolean;
  /** Puerto HTTP (PORT, por defecto 3000). */
  port: number;
  /** Detrás de un proxy/balanceador (nginx, etc.): confiar en `X-Forwarded-For` para saber la IP real (TRUST_PROXY). */
  trustProxy: boolean;
  /** Carpeta del frontend compilado que se sirve en `/` (FRONTEND_DIST, por defecto `frontend/dist`). */
  frontendDist: string;
  /** Cookie anónima del sitio público: identifica a cada navegador que visita el sitio. */
  visitor: {
    cookieName: string;
    /** Duración en días (VISITOR_TTL_DAYS, por defecto 30). Se renueva sola al usarse. */
    ttlDays: number;
  };
  api: {
    /** Pedidos por minuto por cliente (API_RATE_LIMIT_PER_MIN, por defecto 120; 0 = sin límite). Por IP se tolera 5 veces esto. */
    rateLimitPerMinute: number;
  };
  auth: {
    /** Clave para firmar la cookie de sesión del backoffice. */
    sessionSecret: string;
    /** Duración de la sesión en horas (SESSION_TTL_HOURS, por defecto 8). */
    sessionTtlHours: number;
    /** Nombre de la cookie de sesión. */
    cookieName: string;
    /** Si la cookie viaja solo por HTTPS (COOKIE_SECURE; por defecto true en producción). */
    cookieSecure: boolean;
    /** Contraseña de los usuarios de ejemplo. Sin valor => no se siembran usuarios. */
    seedPassword?: string;
    /**
     * Login de desarrollo: pantalla con los usuarios de ejemplo y acceso con un
     * clic, SIN contraseña (DEV_LOGIN). Por defecto true fuera de producción.
     * En producción es imposible activarlo: la app no arranca si DEV_LOGIN=true.
     */
    devLogin: boolean;
  };
}

/** Entero obligatoriamente dentro de [min, max]; vacío/ausente => `fallback`. */
function toInt(name: string, raw: string | undefined, fallback: number, min: number, max: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Config inválida: ${name}="${raw}" (entero entre ${min} y ${max})`);
  }
  return n;
}

/** Acepta solo `true` o `false` (cualquier otra cosa es un error de config); vacío => `fallback`. */
function toBool(name: string, raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === '') return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`Config inválida: ${name}="${raw}" (usar true o false)`);
}

/**
 * Lee y VALIDA las variables de entorno una sola vez, al arrancar.
 * Si falta algo crítico en producción, la app no levanta.
 *
 * @param env Variables a leer (por defecto `process.env`; se inyecta en los tests).
 * @throws Error con el nombre de la variable cuando un valor es inválido.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Config inválida: NODE_ENV="${nodeEnv}"`);
  }
  const isProd = nodeEnv === 'production';

  let sessionSecret = env.SESSION_SECRET;
  if (isProd) {
    if (!sessionSecret || sessionSecret.length < 32) {
      throw new Error('Config inválida: SESSION_SECRET es obligatoria en producción (mínimo 32 caracteres)');
    }
  } else if (!sessionSecret) {
    // En desarrollo: clave aleatoria por proceso (las sesiones se invalidan al reiniciar).
    sessionSecret = randomBytes(32).toString('hex');
  }

  // El login sin contraseña NUNCA puede quedar activo en producción, ni por error.
  const devLogin = toBool('DEV_LOGIN', env.DEV_LOGIN, !isProd);
  if (isProd && devLogin) {
    throw new Error('Config inválida: DEV_LOGIN=true no está permitido en producción');
  }

  return {
    env: nodeEnv as AppConfig['env'],
    isProd,
    port: toInt('PORT', env.PORT, 3000, 1, 65535),
    trustProxy: toBool('TRUST_PROXY', env.TRUST_PROXY, false),
    frontendDist: env.FRONTEND_DIST || 'frontend/dist',
    visitor: {
      cookieName: 'favl_visitor',
      ttlDays: toInt('VISITOR_TTL_DAYS', env.VISITOR_TTL_DAYS, 30, 1, 365),
    },
    api: {
      rateLimitPerMinute: toInt('API_RATE_LIMIT_PER_MIN', env.API_RATE_LIMIT_PER_MIN, 120, 0, 100_000),
    },
    auth: {
      sessionSecret,
      sessionTtlHours: toInt('SESSION_TTL_HOURS', env.SESSION_TTL_HOURS, 8, 1, 24 * 30),
      cookieName: 'favl_session',
      cookieSecure: toBool('COOKIE_SECURE', env.COOKIE_SECURE, isProd),
      seedPassword: env.SEED_PASSWORD || (isProd ? undefined : 'favl1234'),
      devLogin,
    },
  };
}
